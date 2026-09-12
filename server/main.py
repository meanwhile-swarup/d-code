import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Set

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, engine, SessionLocal, Base
from models import User, Problem, Submission, Duel, DuelMove, Friend, Puzzle, PuzzleAttempt, Achievement, UserAchievement, ActivityLog
from schemas import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    ProblemResponse, ProblemListResponse,
    SubmissionCreate, SubmissionResponse,
    DuelCreate, DuelResponse,
    FriendResponse, FriendRequestResponse,
    PuzzleResponse, PuzzleAttemptCreate, PuzzleAttemptResponse,
    AchievementResponse, ActivityResponse, LeaderboardEntry,
)
from auth import create_access_token, verify_token, get_current_user
from passlib.context import CryptContext
from seed import seed

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="D:CODE API")

CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    seed()


@app.get("/")
def health_check():
    return {"status": "ok", "service": "dcode-api"}


# ── Auth Routes ──────────────────────────────────────────────

@app.post("/api/auth/signup", status_code=201)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    try:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

        import uuid
        hashed = pwd_context.hash(data.password)
        user = User(
            id=str(uuid.uuid4()),
            username=data.username,
            email=data.email,
            password_hash=hashed,
            name=data.name or data.username,
            avatar=data.username[:2].upper(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)
        return {"data": {"token": token, "user": _user_dict(user)}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not pwd_context.verify(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(user.id)
        return {"data": {"token": token, "user": _user_dict(user)}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": _user_dict(user)}


# ── User Routes ──────────────────────────────────────────────

@app.get("/api/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": _user_dict(user)}


@app.put("/api/users/{user_id}")
def update_user(user_id: str, data: UserUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update = data.model_dump(exclude_unset=True)
    for key, val in update.items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return {"data": _user_dict(user)}


# ── Problem Routes ───────────────────────────────────────────

@app.get("/api/problems")
def list_problems(
    difficulty: str = None,
    topic: str = None,
    search: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if topic:
        query = query.filter(Problem.topics.contains(topic))
    if search:
        query = query.filter(Problem.title.ilike(f"%{search}%"))

    problems = query.order_by(Problem.id).all()
    all_topics = set()
    result = []
    for p in problems:
        topics = p.topics or []
        all_topics.update(topics)
        result.append({
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "topics": topics,
            "acceptance": p.acceptance,
            "solved": False,
            "attempted": False,
            "isDaily": p.id == 5,
        })

    return {"data": {"problems": result, "allTopics": sorted(all_topics)}}


@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"data": _problem_dict(problem)}


# ── Execute Routes ───────────────────────────────────────────

@app.post("/api/execute")
def execute_code(data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        pid = data.get("problem_id") or data.get("problemId")
        problem = db.query(Problem).filter(Problem.id == pid).first()
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")

        code = data.get("code", "")
        language = data.get("language", "javascript")
        mode = data.get("mode", "run")

        from judge import parse_test_input, parse_expected_output, execute_judge
        raw_examples = problem.examples
        if isinstance(raw_examples, str):
            raw_examples = _json.loads(raw_examples)
        raw_examples = raw_examples or []
        test_cases = []
        for ex in (raw_examples[:3] if mode == "run" else raw_examples):
            args = parse_test_input(ex.get("input", ""))
            expected = parse_expected_output(ex.get("output", ""))
            test_cases.append({"args": args, "expected": expected})

        if not test_cases:
            raise HTTPException(status_code=400, detail="No test cases for this problem")

        param_types = problem.param_types or []
        if isinstance(param_types, str):
            param_types = _json.loads(param_types)

        import time as _time
        start = _time.time()
        result = execute_judge(
            code=code,
            test_cases=test_cases,
            param_types=param_types,
            return_type=problem.return_type or "auto",
            is_mutation=problem.is_mutation or False,
            mutate_arg=problem.mutate_arg or 0,
            order_matters=problem.order_matters if problem.order_matters is not None else True,
            time_limit=problem.time_limit or 5
        )
        runtime_ms = round((_time.time() - start) * 1000)
        result["runtime"] = runtime_ms

        if mode == "submit":
            sub = Submission(
                user_id=current_user["user_id"],
                problem_id=problem.id,
                code=code,
                language=language,
                status=result.get("status", "error"),
                runtime=runtime_ms,
                tests_passed=result.get("testsPassed", 0),
                tests_total=result.get("testsTotal", 0),
            )
            db.add(sub)
            db.commit()

        return {"data": result}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Leaderboard Routes ──────────────────────────────────────

def _get_tier(rating: int) -> str:
    if rating >= 2000:
        return "Grandmaster"
    if rating >= 1800:
        return "Master"
    if rating >= 1600:
        return "Diamond"
    if rating >= 1400:
        return "Platinum"
    if rating >= 1200:
        return "Gold"
    if rating >= 1000:
        return "Silver"
    return "Bronze"


@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.rating.desc()).all()
    result = []
    for i, u in enumerate(users, 1):
        result.append({
            "rank": i,
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar,
            "rating": u.rating,
            "wins": u.wins,
            "losses": u.losses,
            "tier": _get_tier(u.rating),
            "rankChange": "same",
        })
    return {"data": result}


@app.get("/api/leaderboard/weekly")
def get_weekly_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.rating.desc()).limit(15).all()
    result = []
    for i, u in enumerate(users, 1):
        result.append({
            "rank": i,
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar,
            "rating": u.rating,
            "wins": u.wins,
            "losses": u.losses,
            "tier": _get_tier(u.rating),
        })
    return {"data": result}


@app.get("/api/leaderboard/friends")
def get_friends_leaderboard(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    friendships = db.query(Friend).filter(
        ((Friend.user_id == uid) | (Friend.friend_id == uid)),
        Friend.status == "accepted",
    ).all()
    friend_ids = [f.friend_id if f.user_id == uid else f.user_id for f in friendships]
    if not friend_ids:
        return {"data": []}

    friends = db.query(User).filter(User.id.in_(friend_ids)).order_by(User.rating.desc()).all()
    result = []
    for i, u in enumerate(friends, 1):
        result.append({
            "rank": i,
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar,
            "rating": u.rating,
            "wins": u.wins,
            "losses": u.losses,
            "tier": _get_tier(u.rating),
        })
    return {"data": result}


# ── Duel Routes ──────────────────────────────────────────────

@app.get("/api/duels")
def get_duels(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    duels = db.query(Duel).filter(
        (Duel.player1_id == uid) | (Duel.player2_id == uid)
    ).order_by(Duel.created_at.desc()).all()

    result = []
    for d in duels:
        opp_id = d.player2_id if d.player1_id == uid else d.player1_id
        opp = db.query(User).filter(User.id == opp_id).first() if opp_id else None
        result_user = None
        if opp:
            result_user = {"id": opp.id, "username": opp.username, "avatar": opp.avatar, "rating": opp.rating}

        result.append({
            "id": d.id,
            "opponent": result_user,
            "status": d.status,
            "result": "W" if d.winner_id == uid else ("L" if d.winner_id else ("D" if d.status == "completed" else "pending")),
            "problem_id": d.problem_id,
            "format": d.format,
            "type": d.type,
            "winnerId": d.winner_id,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "completed_at": d.completed_at.isoformat() if d.completed_at else None,
        })
    return {"data": result}


@app.get("/api/execute/solved")
def get_solved_problems(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    subs = db.query(Submission).filter(
        Submission.user_id == uid,
        Submission.status == "accepted",
    ).order_by(Submission.created_at.desc()).all()
    seen = {}
    for s in subs:
        if s.problem_id not in seen:
            seen[s.problem_id] = s
    result = []
    for pid, s in seen.items():
        p = db.query(Problem).filter(Problem.id == pid).first()
        if not p:
            continue
        result.append({
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "solvedAt": s.created_at.isoformat() if s.created_at else None,
            "runtime": s.runtime,
            "language": s.language,
        })
    return {"data": result}


@app.get("/api/users/search")
def search_users(q: str = "", current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    query = (q or "").strip()
    if not query:
        return {"data": []}
    users = db.query(User).filter(
        ((User.username.ilike(f"%{query}%")) | (User.name.ilike(f"%{query}%"))),
        User.id != uid,
    ).limit(10).all()
    friendships = db.query(Friend).filter(
        (Friend.user_id == uid) | (Friend.friend_id == uid)
    ).all()
    status_map = {}
    for f in friendships:
        other = f.friend_id if f.user_id == uid else f.user_id
        if f.status == "accepted":
            status_map[other] = "friends"
        elif f.user_id == uid:
            status_map[other] = "sent"
        else:
            status_map[other] = "received"
    return {"data": [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "avatar": u.avatar,
            "rating": u.rating,
            "friendshipStatus": status_map.get(u.id, "none"),
        }
        for u in users
    ]}


@app.post("/api/duels", status_code=201)
def create_duel(data: DuelCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    import uuid
    uid = current_user["user_id"]

    if data.opponent_id:
        opp = db.query(User).filter(User.id == data.opponent_id).first()
        if not opp:
            raise HTTPException(status_code=404, detail="Opponent not found")
        duel = Duel(
            id=str(uuid.uuid4()),
            type=data.type,
            format=data.format,
            player1_id=uid,
            player2_id=data.opponent_id,
            status="active",
            problem_id=data.problem_id,
        )
    else:
        pending = db.query(Duel).filter(Duel.status == "waiting", Duel.player1_id != uid, Duel.format == data.format).first()
        if pending:
            pending.player2_id = uid
            pending.status = "active"
            duel = pending
        else:
            duel = Duel(
                id=str(uuid.uuid4()),
                type=data.type,
                format=data.format,
                player1_id=uid,
                status="waiting",
                problem_id=data.problem_id,
            )

    db.add(duel)
    db.commit()
    db.refresh(duel)
    return {"data": {
        "id": duel.id,
        "status": duel.status,
        "problem_id": duel.problem_id,
        "created_at": duel.created_at.isoformat() if duel.created_at else None,
    }}


# ── Friend Routes ────────────────────────────────────────────

@app.get("/api/friends")
def get_friends(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]

    accepted = db.query(Friend).filter(
        ((Friend.user_id == uid) | (Friend.friend_id == uid)),
        Friend.status == "accepted",
    ).all()
    friends = []
    for f in accepted:
        fid = f.friend_id if f.user_id == uid else f.user_id
        u = db.query(User).filter(User.id == fid).first()
        if u:
            friends.append({"id": u.id, "username": u.username, "avatar": u.avatar, "rating": u.rating, "status": "accepted"})

    pending_recv = db.query(Friend).filter(Friend.friend_id == uid, Friend.status == "pending").all()
    pending_received = []
    for f in pending_recv:
        u = db.query(User).filter(User.id == f.user_id).first()
        if u:
            pending_received.append({"id": u.id, "username": u.username, "avatar": u.avatar, "rating": u.rating, "status": "pending", "friendship_id": f.id})

    pending_sent = db.query(Friend).filter(Friend.user_id == uid, Friend.status == "pending").all()
    sent = []
    for f in pending_sent:
        u = db.query(User).filter(User.id == f.friend_id).first()
        if u:
            sent.append({"id": u.id, "username": u.username, "avatar": u.avatar, "rating": u.rating, "status": "sent", "friendship_id": f.id})

    return {"data": {"friends": friends, "pending_received": pending_received, "pending_sent": sent}}


@app.post("/api/friends/{friend_id}/request", status_code=201)
def send_friend_request(friend_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    import uuid
    uid = current_user["user_id"]
    if uid == friend_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")

    target = db.query(User).filter(User.id == friend_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Friend).filter(
        ((Friend.user_id == uid) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == uid))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")

    friendship = Friend(id=str(uuid.uuid4()), user_id=uid, friend_id=friend_id, status="pending")
    db.add(friendship)
    db.commit()
    return {"data": {"message": "Friend request sent"}}


@app.post("/api/friends/{friend_id}/accept")
def accept_friend_request(friend_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    friendship = db.query(Friend).filter(
        Friend.user_id == friend_id, Friend.friend_id == uid, Friend.status == "pending"
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    friendship.status = "accepted"
    db.commit()
    return {"data": {"message": "Friend request accepted"}}


@app.delete("/api/friends/{friend_id}")
def remove_friend(friend_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = current_user["user_id"]
    friendship = db.query(Friend).filter(
        ((Friend.user_id == uid) & (Friend.friend_id == friend_id)) |
        ((Friend.user_id == friend_id) & (Friend.friend_id == uid))
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    db.delete(friendship)
    db.commit()
    return {"data": {"message": "Friend removed"}}


# ── Puzzle Routes ────────────────────────────────────────────

def _parse_answers(raw):
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


@app.get("/api/puzzles/daily")
def get_daily_puzzle(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).order_by(Puzzle.id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="No puzzles available")

    attempt = db.query(PuzzleAttempt).filter(
        PuzzleAttempt.user_id == current_user["user_id"],
        PuzzleAttempt.puzzle_id == puzzle.id,
    ).first()

    return {"data": {
        "id": puzzle.id,
        "title": puzzle.title,
        "difficulty": puzzle.difficulty,
        "language": puzzle.language,
        "code": puzzle.code,
        "question": puzzle.question,
        "answers": _parse_answers(puzzle.answers),
        "correctIndex": puzzle.correct_index,
        "xp": puzzle.xp,
        "explanation": puzzle.explanation,
        "attempted": attempt is not None,
        "correct": attempt.correct if attempt else None,
    }}


@app.get("/api/puzzles")
def list_puzzles(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    puzzles = db.query(Puzzle).all()
    result = []
    for p in puzzles:
        attempt = db.query(PuzzleAttempt).filter(
            PuzzleAttempt.user_id == current_user["user_id"],
            PuzzleAttempt.puzzle_id == p.id,
        ).first()
        result.append({
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "language": p.language,
            "code": p.code,
            "question": p.question,
            "answers": _parse_answers(p.answers),
            "correctIndex": p.correct_index,
            "xp": p.xp,
            "explanation": p.explanation,
            "attempted": attempt is not None,
            "correct": attempt.correct if attempt else None,
        })
    return {"data": result}


@app.post("/api/puzzles/{puzzle_id}/attempt", status_code=201)
def attempt_puzzle(puzzle_id: int, data: PuzzleAttemptCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    import uuid
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    existing = db.query(PuzzleAttempt).filter(
        PuzzleAttempt.user_id == current_user["user_id"],
        PuzzleAttempt.puzzle_id == puzzle_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already attempted this puzzle")

    correct = data.answer == puzzle.correct_index
    attempt = PuzzleAttempt(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        puzzle_id=puzzle_id,
        answer=data.answer,
        correct=correct,
    )
    db.add(attempt)
    db.commit()
    return {"data": {"correct": correct, "puzzle_id": puzzle_id, "attempt_id": attempt.id}}


# ── Achievement Routes ───────────────────────────────────────

@app.get("/api/achievements")
def list_achievements(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    achievements = db.query(Achievement).all()
    user_achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user["user_id"]
    ).all()
    earned_ids = {ua.achievement_id for ua in user_achievements}

    result = []
    for a in achievements:
        earned = a.id in earned_ids
        earned_at = None
        if earned:
            ua = next((u for u in user_achievements if u.achievement_id == a.id), None)
            earned_at = ua.earned_at.isoformat() if ua and ua.earned_at else None
        result.append({
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "conditionKey": a.condition_key,
            "earned": earned,
            "earnedAt": earned_at,
        })
    return {"data": result}


# ── Activity Routes ──────────────────────────────────────────

@app.get("/api/activity")
def get_activity(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user["user_id"]
    ).order_by(ActivityLog.created_at.desc()).limit(50).all()

    result = []
    for a in logs:
        result.append({
            "id": a.id,
            "type": a.type,
            "details": a.details,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        })
    return {"data": result}


# ── WebSocket Duel Handler ───────────────────────────────────

import random as _random
import time as _time
from typing import Dict, Set
import asyncio

from scoring import calculate_problem_score, aggregate_match_score
from rating import calculate_rating_change, determine_match_result
from formats import get_format_by_id

TEST_PROBLEMS = [
    {"id": "test_1", "title": "Hello World", "difficulty": "Easy", "description": "Return the string 'Hello, World!'", "examples": [{"input": "", "output": "'Hello, World!'"}], "starterCode": "function helloWorld() {\n  // your code here\n}", "inputFormat": "", "outputFormat": "Return a string", "constraints": []},
    {"id": "test_2", "title": "Add Two Numbers", "difficulty": "Easy", "description": "Return the sum of two numbers a and b.", "examples": [{"input": "a = 2, b = 3", "output": "5"}, {"input": "a = -1, b = 1", "output": "0"}], "starterCode": "function add(a, b) {\n  // your code here\n}", "inputFormat": "Two integers", "outputFormat": "An integer", "constraints": []},
    {"id": "test_3", "title": "Double Input", "difficulty": "Easy", "description": "Return the input number multiplied by 2.", "examples": [{"input": "n = 5", "output": "10"}, {"input": "n = -3", "output": "-6"}], "starterCode": "function double(n) {\n  // your code here\n}", "inputFormat": "An integer", "outputFormat": "An integer", "constraints": []},
    {"id": "test_4", "title": "Return the String", "difficulty": "Easy", "description": "Return the same string that was passed in.", "examples": [{"input": "s = 'hello'", "output": "'hello'"}, {"input": "s = ''", "output": "''"}], "starterCode": "function returnString(s) {\n  // your code here\n}", "inputFormat": "A string", "outputFormat": "The same string", "constraints": []},
    {"id": "test_5", "title": "Is Positive", "difficulty": "Easy", "description": "Return true if the number is positive, false otherwise.", "examples": [{"input": "n = 5", "output": "true"}, {"input": "n = -5", "output": "false"}, {"input": "n = 0", "output": "false"}], "starterCode": "function isPositive(n) {\n  // your code here\n}", "inputFormat": "An integer", "outputFormat": "A boolean", "constraints": []},
]


def _parse_examples(raw):
    import json as _json
    if isinstance(raw, str):
        try:
            return _json.loads(raw)
        except Exception:
            return []
    return raw or []


def _get_user_info(db, user_id):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        return {"userId": user_id, "username": "Unknown", "rating": 1000, "avatar": "UN"}
    return {"userId": u.id, "username": u.username, "rating": u.rating, "avatar": u.avatar or u.username[:2].upper()}


def _select_problems(db, count, difficulty=None):
    query = db.query(Problem)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    all_probs = query.all()
    if len(all_probs) < count:
        count = len(all_probs)
    chosen = _random.sample(all_probs, count) if all_probs else []
    result = []
    for p in chosen:
        ex = _parse_examples(p.examples)
        p_types = p.param_types or []
        if isinstance(p_types, str):
            try:
                p_types = json.loads(p_types)
            except Exception:
                p_types = []
        result.append({
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "description": p.description or "",
            "inputFormat": p.input_format or "",
            "outputFormat": p.output_format or "",
            "constraints": p.constraints or [],
            "examples": ex,
            "starterCode": p.starter_code or "",
            "topics": p.topics or [],
            "param_types": p_types,
            "return_type": p.return_type or "auto",
            "is_mutation": p.is_mutation or False,
            "mutate_arg": p.mutate_arg or 0,
            "order_matters": p.order_matters if p.order_matters is not None else True,
        })
    return result


def _get_format_dict(fmt_id):
    fmt = get_format_by_id(fmt_id)
    if not fmt:
        fmt = {"id": "sprint", "name": "Sprint", "problems": 5, "duration_minutes": 10}
    return {"id": fmt["id"], "name": fmt["name"], "problems": fmt["problems"], "durationMinutes": fmt["duration_minutes"]}


class DuelRoom:
    def __init__(self, room_id, players, format_id="sprint", room_type="ranked"):
        self.room_id = room_id
        self.players = {p[0]: p[1] for p in players}
        self.user_info = {}
        self.format = _get_format_dict(format_id)
        self.room_type = room_type
        self.problems = []
        self.current_index = 0
        self.scores = {}
        self.submissions = {}
        self.score_records = {}
        self.player_times = {}
        self.start_time = None
        self.timer_task = None
        self.rematch_votes = set()
        self.is_finished = False

    async def setup(self, db, difficulty=None):
        count = self.format["problems"]
        self.problems = _select_problems(db, count, difficulty)
        self._player_indices = {uid: 0 for uid in self.players}
        for uid in self.players:
            self.scores[uid] = 0
            self.submissions[uid] = {}
            self.score_records[uid] = []
            self.player_times[uid] = []
        for uid, ws in self.players.items():
            self.user_info[uid] = _get_user_info(db, uid)

    async def start(self, db):
        self.start_time = _time.time()
        duration = self.format["durationMinutes"] * 60
        failed_users = []
        for uid, ws in list(self.players.items()):
            opp_id = [u for u in self.players if u != uid][0]
            try:
                await ws.send_json({
                    "type": "match_found",
                    "roomId": self.room_id,
                    "opponent": self.user_info.get(opp_id, {}),
                    "player": self.user_info.get(uid, {}),
                    "problem": self.problems[0] if self.problems else {},
                    "format": self.format,
                    "questionIndex": 0,
                    "totalQuestions": len(self.problems),
                    "timeLimit": duration,
                })
            except Exception:
                failed_users.append(uid)
        for uid in failed_users:
            del self.players[uid]
        if not self.players:
            return
        if failed_users:
            for uid in list(self.players):
                await self.send_to(uid, {"type": "player_disconnected"})
            self.is_finished = True
            if self.timer_task:
                self.timer_task.cancel()
            return
        self.timer_task = asyncio.create_task(self._timer(duration))

    async def _timer(self, duration):
        await asyncio.sleep(duration)
        if not self.is_finished:
            await self._end_match("timeout")

    async def broadcast(self, msg):
        for uid, ws in self.players.items():
            try:
                await ws.send_json(msg)
            except Exception:
                pass

    async def send_to(self, uid, msg):
        ws = self.players.get(uid)
        if ws:
            try:
                await ws.send_json(msg)
            except Exception:
                pass

    def _get_player_index(self, user_id):
        return getattr(self, '_player_indices', {}).get(user_id, 0)

    async def handle_submit(self, user_id, code, db):
        if self.is_finished:
            return
        if not hasattr(self, '_player_indices'):
            self._player_indices = {uid: 0 for uid in self.players}
        idx = self._player_indices[user_id]
        if idx >= len(self.problems):
            return
        problem = self.problems[idx]
        from judge import parse_test_input, parse_expected_output, execute_judge
        raw_ex = problem.get("examples", []) if isinstance(problem, dict) else (problem.examples or [])
        if isinstance(raw_ex, str):
            raw_ex = json.loads(raw_ex)
        test_cases = []
        for ex in raw_ex:
            args = parse_test_input(ex.get("input", ""))
            expected = parse_expected_output(ex.get("output", ""))
            test_cases.append({"args": args, "expected": expected})

        p_types = problem.get("param_types", []) if isinstance(problem, dict) else (problem.param_types or [])
        if isinstance(p_types, str):
            p_types = json.loads(p_types)
        r_type = problem.get("return_type", "auto") if isinstance(problem, dict) else (problem.return_type or "auto")
        is_mut = problem.get("is_mutation", False) if isinstance(problem, dict) else (problem.is_mutation or False)
        mut_arg = problem.get("mutate_arg", 0) if isinstance(problem, dict) else (problem.mutate_arg or 0)
        ord_mat = problem.get("order_matters", True) if isinstance(problem, dict) else (problem.order_matters if problem.order_matters is not None else True)

        result = execute_judge(
            code=code,
            test_cases=test_cases,
            param_types=p_types,
            return_type=r_type,
            is_mutation=is_mut,
            mutate_arg=mut_arg,
            order_matters=ord_mat
        ) if test_cases else {"status": "error", "testsPassed": 0, "testsTotal": 0, "runtime": 0, "results": []}
        elapsed_ms = (_time.time() - self.start_time) * 1000
        problem_time_ms = result.get("runtime", 1)
        duration_ms = self.format["durationMinutes"] * 60 * 1000
        score_data = calculate_problem_score(
            result.get("testsPassed", 0),
            result.get("testsTotal", 0),
            problem_time_ms,
            problem_time_ms,
            elapsed_ms,
            duration_ms,
        )
        self.submissions[user_id][idx] = {
            "code": code,
            "result": result,
            "score": score_data,
        }
        self.scores[user_id] = self.scores.get(user_id, 0) + score_data["total"]
        self.score_records[user_id].append(score_data)
        self.player_times[user_id].append(elapsed_ms)
        tier_map = {"platinum": "accepted", "gold": "strong_partial", "silver": "partial", "bronze": "failed"}
        tier = tier_map.get(score_data["tier"], "failed")
        await self.send_to(user_id, {
            "type": "duel_submit_result",
            "result": result,
            "totalScore": self.scores[user_id],
            "scoreData": score_data,
        })
        opp_id = [u for u in self.players if u != user_id][0]
        await self.send_to(opp_id, {
            "type": "opponent_submitted",
            "tier": tier,
            "score": score_data["total"],
            "totalScore": self.scores.get(opp_id, 0),
            "problemsCompleted": len(self.submissions.get(opp_id, {})),
            "activity": "coding",
        })
        self._player_indices[user_id] = idx + 1
        next_idx = self._player_indices[user_id]
        if next_idx >= len(self.problems):
            all_done = all(self._player_indices.get(u, 0) >= len(self.problems) for u in self.players)
            if all_done:
                await self._end_match("completed")
            else:
                await self.send_to(user_id, {"type": "all_questions_done"})
        else:
            await self.send_to(user_id, {
                "type": "next_question",
                "question": self.problems[next_idx],
                "questionIndex": next_idx,
                "totalQuestions": len(self.problems),
                "scores": self.scores,
            })

    async def handle_run(self, user_id, code):
        if not hasattr(self, '_player_indices'):
            self._player_indices = {uid: 0 for uid in self.players}
        idx = self._player_indices.get(user_id, 0)
        problem = self.problems[idx] if idx < len(self.problems) else None
        if not problem:
            return
        from judge import parse_test_input, parse_expected_output, execute_judge
        raw_ex = problem.get("examples", []) if isinstance(problem, dict) else (problem.examples or [])
        if isinstance(raw_ex, str):
            raw_ex = json.loads(raw_ex)
        test_cases = []
        for ex in raw_ex[:3]:
            args = parse_test_input(ex.get("input", ""))
            expected = parse_expected_output(ex.get("output", ""))
            test_cases.append({"args": args, "expected": expected})

        p_types = problem.get("param_types", []) if isinstance(problem, dict) else (problem.param_types or [])
        if isinstance(p_types, str):
            p_types = json.loads(p_types)
        r_type = problem.get("return_type", "auto") if isinstance(problem, dict) else (problem.return_type or "auto")
        is_mut = problem.get("is_mutation", False) if isinstance(problem, dict) else (problem.is_mutation or False)
        mut_arg = problem.get("mutate_arg", 0) if isinstance(problem, dict) else (problem.mutate_arg or 0)
        ord_mat = problem.get("order_matters", True) if isinstance(problem, dict) else (problem.order_matters if problem.order_matters is not None else True)

        result = execute_judge(
            code=code,
            test_cases=test_cases,
            param_types=p_types,
            return_type=r_type,
            is_mutation=is_mut,
            mutate_arg=mut_arg,
            order_matters=ord_mat
        ) if test_cases else {"status": "error", "testsPassed": 0, "testsTotal": 0, "runtime": 0, "results": []}
        await self.send_to(user_id, {"type": "duel_run_result", "result": result})

    async def _end_match(self, reason="completed"):
        self.is_finished = True
        if self.timer_task:
            self.timer_task.cancel()
        if len(self.players) < 2:
            for uid in list(self.players):
                await self.send_to(uid, {
                    "type": "duel_result",
                    "result": "draw",
                    "reason": f"Match {reason}. Opponent left.",
                    "ratingChange": 0,
                    "yourScore": None,
                    "opponentScore": None,
                    "yourTotalScore": round(self.scores.get(uid, 0), 1),
                    "opponentTotalScore": 0,
                    "format": self.format,
                    "problemsTotal": len(self.problems),
                })
            return
        p1, p2 = list(self.players.keys())
        s1 = self.scores.get(p1, 0)
        s2 = self.scores.get(p2, 0)
        result = determine_match_result(s1, s2)
        rating_change = calculate_rating_change(
            self.user_info.get(p1, {}).get("rating", 1000),
            self.user_info.get(p2, {}).get("rating", 1000),
            result,
        )
        if self.room_type == "ranked":
            db = next(get_db())
            try:
                u1 = db.query(User).filter(User.id == p1).first()
                u2 = db.query(User).filter(User.id == p2).first()
                if u1:
                    u1.rating = rating_change["newRating1"]
                    if result == "player1":
                        u1.wins += 1
                    elif result == "player2":
                        u1.losses += 1
                    else:
                        u1.draws += 1
                if u2:
                    u2.rating = rating_change["newRating2"]
                    if result == "player2":
                        u2.wins += 1
                    elif result == "player1":
                        u2.losses += 1
                    else:
                        u2.draws += 1
                import uuid as _uuid
                winner_id = p1 if result == "player1" else (p2 if result == "player2" else None)
                first_problem_id = self.problems[0].get("id") if self.problems else None
                duel = Duel(
                    id=str(_uuid.uuid4()),
                    type=self.room_type,
                    format=self.format.get("id", "sprint"),
                    player1_id=p1,
                    player2_id=p2,
                    status="completed",
                    winner_id=winner_id,
                    problem_id=first_problem_id,
                    completed_at=datetime.now(timezone.utc),
                )
                db.add(duel)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()
        for uid in self.players:
            opp_id = [u for u in self.players if u != uid][0]
            is_p1 = uid == p1
            win_label = "player1" if is_p1 else "player2"
            if result == win_label:
                match_result = "win"
            elif result == "draw":
                match_result = "draw"
            else:
                match_result = "lose"
            my_agg = aggregate_match_score(self.score_records.get(uid, []), len(self.problems))
            opp_agg = aggregate_match_score(self.score_records.get(opp_id, []), len(self.problems))
            await self.send_to(uid, {
                "type": "duel_result",
                "result": match_result,
                "reason": f"Match {reason}. {'You scored more!' if match_result == 'win' else 'Opponent scored more!' if match_result == 'lose' else 'Tied!'}",
                "ratingChange": rating_change.get("forPlayer1", 0) if is_p1 else rating_change.get("forPlayer2", 0),
                "yourScore": {
                    "accuracy": round(my_agg["average_correctness"], 1),
                    "avgTimePerProblem": round(my_agg["average_speed"], 1),
                    "problemsCompleted": my_agg["problems_solved"],
                },
                "opponentScore": {
                    "accuracy": round(opp_agg["average_correctness"], 1),
                    "avgTimePerProblem": round(opp_agg["average_speed"], 1),
                    "problemsCompleted": opp_agg["problems_solved"],
                },
                "yourTotalScore": round(s1 if is_p1 else s2, 1),
                "opponentTotalScore": round(s2 if is_p1 else s1, 1),
                "format": self.format,
                "problemsTotal": len(self.problems),
            })


class DuelManager:
    # Seconds a disconnected player has to reconnect before the match
    # is awarded to the remaining opponent.
    GRACE_SECONDS = 30

    def __init__(self):
        self.rooms: Dict[str, DuelRoom] = {}
        self.match_queue: Dict[str, str] = {}
        self.user_rooms: Dict[str, str] = {}
        self.user_sockets: Dict[str, WebSocket] = {}
        self.pending_disconnects: Dict[str, asyncio.Task] = {}

    def _is_ws_open(self, ws):
        return ws is not None and hasattr(ws, 'client_state') and ws.client_state.name == 'CONNECTED'

    def register(self, user_id, ws):
        self.user_sockets[user_id] = ws
        room_id = self.user_rooms.get(user_id)
        if not room_id or room_id not in self.rooms:
            if room_id:
                self.user_rooms.pop(user_id, None)
                asyncio.create_task(self._send_safe(ws, {"type": "match_ended", "reason": "Match room no longer exists"}))
            return
        room = self.rooms[room_id]
        if user_id in room.players:
            room.players[user_id] = ws
            pending = self.pending_disconnects.pop(user_id, None)
            if pending is not None:
                if not pending.done():
                    pending.cancel()
                asyncio.create_task(self._handle_reconnect(room, user_id))

    async def _send_safe(self, ws, msg):
        try:
            await ws.send_json(msg)
        except Exception:
            pass

    def disconnect(self, user_id):
        self.match_queue.pop(user_id, None)
        self.user_sockets.pop(user_id, None)
        room_id = self.user_rooms.pop(user_id, None)  # <-- always clear
        if not room_id or room_id not in self.rooms:
            return
        room = self.rooms[room_id]
        if user_id not in room.players:
            return
        if room.is_finished or len(room.players) < 2:
            self._remove_from_room(user_id, room)
            return
        # Active duel: grace period instead of instant forfeit
        old = self.pending_disconnects.pop(user_id, None)
        if old and not old.done():
            old.cancel()
        task = asyncio.create_task(self._grace_timeout(room.room_id, user_id))
        self.pending_disconnects[user_id] = task
        for o in [u for u in room.players if u != user_id]:
            asyncio.create_task(room.send_to(o, {
                "type": "opponent_gone",
                "graceSeconds": self.GRACE_SECONDS,
            }))

    def _remove_from_room(self, user_id, room):
        self.user_rooms.pop(user_id, None)
        self.pending_disconnects.pop(user_id, None)
        if user_id in room.players:
            del room.players[user_id]
        if not room.players:
            if room.timer_task:
                room.timer_task.cancel()
            self.rooms.pop(room.room_id, None)
        else:
            asyncio.create_task(self._notify_disconnect(room, user_id))

    async def _grace_timeout(self, room_id, user_id):
        try:
            await asyncio.sleep(self.GRACE_SECONDS)
        except asyncio.CancelledError:
            return
        self.pending_disconnects.pop(user_id, None)
        room = self.rooms.get(room_id)
        if not room or room.is_finished or user_id not in room.players:
            if room:
                self._remove_from_room(user_id, room)
            else:
                self.user_rooms.pop(user_id, None)
            return
        # Reconnect window expired: leaver abandons, remaining player wins.
        others = [u for u in room.players if u != user_id]
        room.players.pop(user_id, None)
        self.user_rooms.pop(user_id, None)
        if not others:
            if room.timer_task:
                room.timer_task.cancel()
            self.rooms.pop(room_id, None)
            return
        winner_id = others[0]
        room.is_finished = True
        if room.timer_task:
            room.timer_task.cancel()
        self._apply_abandon(room, leaver_id=user_id, winner_id=winner_id)
        # Send result to ALL players who are still connected,
        # and also mark the leaver as having lost so their frontend
        # can show the result screen even though their WS is closed.
        for uid in room.players:
            is_winner = uid == winner_id
            await room.send_to(uid, {
                "type": "duel_result",
                "result": "win" if is_winner else "lose",
                "reason": "Opponent disconnected" if is_winner else "You disconnected",
                "yourScore": None,
                "opponentScore": None,
                "yourTotalScore": round(room.scores.get(uid, 0), 1),
                "opponentTotalScore": 0,
                "format": room.format,
                "problemsTotal": len(room.problems),
            })
        # Notify the leaver's frontend that the match ended — this
        # ensures their screen transitions out of the duel even though
        # their WebSocket connection has been closed.
        leaver_ws = self.user_sockets.get(user_id)
        if leaver_ws:
            try:
                await leaver_ws.send_json({
                    "type": "duel_result",
                    "result": "lose",
                    "reason": "Opponent disconnected",
                    "yourScore": None,
                    "opponentScore": None,
                    "yourTotalScore": 0,
                    "opponentTotalScore": 0,
                    "format": room.format,
                    "problemsTotal": len(room.problems),
                })
            except Exception:
                pass

    def _apply_abandon(self, room, leaver_id, winner_id):
        """Ratings + win/loss + Duel persistence for abandonment/forfeit."""
        if room.room_type != "ranked":
            return
        db = next(get_db())
        try:
            loser = db.query(User).filter(User.id == leaver_id).first()
            winner = db.query(User).filter(User.id == winner_id).first()
            if loser:
                loser.rating = max(0, (loser.rating or 1000) - 10)
                loser.losses += 1
            if winner:
                winner.rating = (winner.rating or 1000) + 10
                winner.wins += 1
            import uuid as _uuid3
            first_problem_id = room.problems[0].get("id") if room.problems else None
            duel = Duel(
                id=str(_uuid3.uuid4()),
                type=room.room_type,
                format=room.format.get("id", "sprint"),
                player1_id=leaver_id,
                player2_id=winner_id,
                status="completed",
                winner_id=winner_id,
                problem_id=first_problem_id,
                completed_at=datetime.now(timezone.utc),
            )
            db.add(duel)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    async def _handle_reconnect(self, room, user_id):
        if room.is_finished or user_id not in room.players:
            ws = self.user_sockets.get(user_id)
            if ws:
                await self._send_safe(ws, {"type": "match_ended", "reason": "Match already ended"})
            return
        indices = getattr(room, "_player_indices", {}) or {}
        idx = indices.get(user_id, 0)
        if idx >= len(room.problems):
            idx = max(0, len(room.problems) - 1)
        problem = room.problems[idx] if room.problems else {}
        duration = room.format["durationMinutes"] * 60
        elapsed = _time.time() - room.start_time if room.start_time else 0
        time_left = max(0, int(duration - elapsed))
        submitted = idx in (room.submissions.get(user_id, {}) or {})
        opp_id = [u for u in room.players if u != user_id]
        opp_id = opp_id[0] if opp_id else None
        await room.send_to(user_id, {
            "type": "duel_resync",
            "roomId": room.room_id,
            "question": problem,
            "questionIndex": idx,
            "totalQuestions": len(room.problems),
            "scores": room.scores,
            "format": room.format,
            "timeLimit": time_left,
            "submitted": submitted,
            "opponent": room.user_info.get(opp_id, {}) if opp_id else {},
            "player": room.user_info.get(user_id, {}),
        })
        for o in [u for u in room.players if u != user_id]:
            await room.send_to(o, {"type": "opponent_back"})

    async def _notify_disconnect(self, room, user_id):
        opp_id = [u for u in room.players if u != user_id]
        if opp_id:
            await room.send_to(opp_id[0], {"type": "player_disconnected"})

    async def find_match(self, user_id, format_id, db):
        ws = self.user_sockets.get(user_id)
        if not ws:
            return
        if format_id not in ("sprint", "standard", "extended"):
            await ws.send_json({"type": "error", "message": "Invalid format"})
            return

        # Clean up old finished room reference so it doesn't block re-queuing
        existing_room_id = self.user_rooms.get(user_id)
        if existing_room_id and existing_room_id in self.rooms:
            room = self.rooms[existing_room_id]
            if not room.is_finished:
                await ws.send_json({"type": "error", "message": "You are already in an active duel"})
                return
            # Room is finished — clear the stale reference so this user can queue freely
            self.user_rooms.pop(user_id, None)

        # Purge any stale entries in the queue that have dead WebSocket connections
        stale_ids = [
            uid for uid in list(self.match_queue.keys())
            if uid != user_id and (
                uid not in self.user_sockets or not self._is_ws_open(self.user_sockets.get(uid))
            )
        ]
        for stale_id in stale_ids:
            print(f"[MATCH] Removing stale queue entry: {stale_id}")
            self.match_queue.pop(stale_id, None)

        # Enqueue this user with the requested format
        self.match_queue[user_id] = format_id
        print(f"[MATCH] {user_id} queued for '{format_id}'. Queue: {dict(self.match_queue)}")

        # Find a valid opponent queued for the SAME format
        opponent_id = None
        for uid, fmt in list(self.match_queue.items()):
            if uid == user_id or fmt != format_id:
                continue
            opp_ws_candidate = self.user_sockets.get(uid)
            if opp_ws_candidate and self._is_ws_open(opp_ws_candidate):
                opponent_id = uid
                break
            else:
                # Dead socket in queue — clean it up and keep searching
                print(f"[MATCH] Skipping stale queue entry: {uid}")
                self.match_queue.pop(uid, None)

        if opponent_id:
            opp_ws = self.user_sockets.get(opponent_id)
            self.match_queue.pop(user_id, None)
            self.match_queue.pop(opponent_id, None)
            print(f"[MATCH] Matched {user_id} ({format_id}) vs {opponent_id} ({format_id})")
            import uuid
            room_id = str(uuid.uuid4())
            room = DuelRoom(room_id, [(user_id, ws), (opponent_id, opp_ws)], format_id, "ranked")
            await room.setup(db)
            self.rooms[room_id] = room
            self.user_rooms[user_id] = room_id
            self.user_rooms[opponent_id] = room_id
            try:
                await room.start(db)
            except Exception as e:
                print(f"[MATCH] Room start failed: {e}")
                self.rooms.pop(room_id, None)
                self.user_rooms.pop(user_id, None)
                self.user_rooms.pop(opponent_id, None)
                # Re-queue both players so they can be matched again
                self.match_queue[user_id] = format_id
                self.match_queue[opponent_id] = format_id
                try:
                    await ws.send_json({"type": "waiting", "message": "Looking for opponent..."})
                except Exception:
                    pass
                try:
                    await opp_ws.send_json({"type": "waiting", "message": "Looking for opponent..."})
                except Exception:
                    pass
        else:
            await ws.send_json({"type": "waiting", "message": "Looking for opponent..."})

    async def cancel_match(self, user_id):
        self.match_queue.pop(user_id, None)
        ws = self.user_sockets.get(user_id)
        if ws:
            await ws.send_json({"type": "match_cancelled"})

    async def create_test_room(self, user_id, format_id, db):
        ws = self.user_sockets.get(user_id)
        if not ws:
            return
        import uuid
        room_code = str(uuid.uuid4())[:6].upper()
        room_id = f"test-{room_code}"
        room = DuelRoom(room_id, [(user_id, ws)], format_id, "test")
        await room.setup(db)
        self.rooms[room_id] = room
        self.user_rooms[user_id] = room_id
        await ws.send_json({
            "type": "test_room_created",
            "roomCode": room_code,
            "format": room.format,
        })

    async def join_test_room(self, user_id, room_code, db):
        ws = self.user_sockets.get(user_id)
        if not ws:
            return
        room_id = f"test-{room_code.upper()}"
        room = self.rooms.get(room_id)
        if not room:
            await ws.send_json({"type": "error", "message": "Room not found"})
            return
        if len(room.players) >= 2:
            await ws.send_json({"type": "error", "message": "Room is full"})
            return
        if room.is_finished:
            await ws.send_json({"type": "error", "message": "Match already ended"})
            return
        room.players[user_id] = ws
        self.user_rooms[user_id] = room_id
        host_id = [u for u in room.players if u != user_id][0]
        host_info = room.user_info.get(host_id, _get_user_info(db, host_id))
        joiner_info = _get_user_info(db, user_id)
        room.user_info[user_id] = joiner_info
        duration = room.format["durationMinutes"] * 60

        # Send to BOTH players, tracking delivery. If the host is unreachable,
        # roll the join back instead of leaving the joiner in a half-joined
        # room. If the joiner is unreachable, keep the host waiting.
        host_msg = {
            "type": "test_opponent_joined",
            "roomCode": room_code,
            "question": room.problems[0] if room.problems else {},
            "opponent": room.user_info.get(user_id, {}),
            "player": room.user_info.get(host_id, {}),
            "totalQuestions": len(room.problems),
            "format": room.format,
            "timeLimit": duration,
        }
        joiner_msg = {
            "type": "test_room_joined",
            "roomCode": room_code,
            "question": room.problems[0] if room.problems else {},
            "opponent": room.user_info.get(host_id, {}),
            "player": room.user_info.get(user_id, {}),
            "totalQuestions": len(room.problems),
            "format": room.format,
            "timeLimit": duration,
        }
        host_ok = await self._try_send(room, host_id, host_msg)
        if not host_ok:
            room.players.pop(user_id, None)
            self.user_rooms.pop(user_id, None)
            try:
                await ws.send_json({"type": "error", "message": "Host unreachable, try again"})
            except Exception:
                pass
            return
        joiner_ok = await self._try_send(room, user_id, joiner_msg)
        if not joiner_ok:
            room.players.pop(user_id, None)
            self.user_rooms.pop(user_id, None)
            return
        room.start_time = _time.time()
        if room.timer_task:
            room.timer_task.cancel()
        room.timer_task = asyncio.create_task(room._timer(duration))

    async def _try_send(self, room, user_id, msg) -> bool:
        ws = room.players.get(user_id)
        if not ws:
            return False
        try:
            await ws.send_json(msg)
            return True
        except Exception:
            return False

    async def handle_submit(self, user_id, code, db):
        room_id = self.user_rooms.get(user_id)
        room = self.rooms.get(room_id) if room_id else None
        if room:
            await room.handle_submit(user_id, code, db)

    async def handle_run(self, user_id, code):
        room_id = self.user_rooms.get(user_id)
        room = self.rooms.get(room_id) if room_id else None
        if room:
            await room.handle_run(user_id, code)

    async def handle_activity(self, user_id, activity):
        room_id = self.user_rooms.get(user_id)
        room = self.rooms.get(room_id) if room_id else None
        if room:
            opp_id = [u for u in room.players if u != user_id]
            if opp_id:
                await room.send_to(opp_id[0], {"type": "opponent_activity", "activity": activity})

    async def handle_forfeit(self, user_id):
        room_id = self.user_rooms.get(user_id)
        room = self.rooms.get(room_id) if room_id else None
        if room and not room.is_finished:
            others = [u for u in room.players if u != user_id]
            if not others:
                room.is_finished = True
                if room.timer_task:
                    room.timer_task.cancel()
                return
            opp_id = others[0]
            room.is_finished = True
            if room.timer_task:
                room.timer_task.cancel()
            self._apply_abandon(room, leaver_id=user_id, winner_id=opp_id)
            for uid in room.players:
                is_forfeiter = uid == user_id
                await room.send_to(uid, {
                    "type": "duel_result",
                    "result": "lose" if is_forfeiter else "win",
                    "reason": "Opponent forfeited" if not is_forfeiter else "You forfeited",
                    "ratingChange": -10 if is_forfeiter else 10,
                    "yourScore": None,
                    "opponentScore": None,
                    "yourTotalScore": 0,
                    "opponentTotalScore": 0,
                    "format": room.format,
                    "problemsTotal": len(room.problems),
                })

    async def handle_rematch(self, user_id, db):
        room_id = self.user_rooms.get(user_id)
        room = self.rooms.get(room_id) if room_id else None
        if not room:
            return
        room.rematch_votes.add(user_id)
        for uid in room.players:
            await room.send_to(uid, {"type": "rematch_status", "votes": len(room.rematch_votes)})
        if len(room.rematch_votes) >= len(room.players):
            room.is_finished = False
            room.rematch_votes.clear()
            room._player_indices = {uid: 0 for uid in room.players}
            room.submissions = {}
            room.score_records = {}
            room.player_times = {}
            for uid in room.players:
                room.scores[uid] = 0
                room.submissions[uid] = {}
                room.score_records[uid] = []
                room.player_times[uid] = []
            await room.setup(db)
            room.start_time = _time.time()
            duration = room.format["durationMinutes"] * 60
            for uid in room.players:
                opp_id = [u for u in room.players if u != uid][0]
                await room.send_to(uid, {
                    "type": "rematch_start",
                    "problem": room.problems[0] if room.problems else {},
                    "opponent": room.user_info.get(opp_id, {}),
                    "player": room.user_info.get(uid, {}),
                    "format": room.format,
                    "totalQuestions": len(room.problems),
                    "timeLimit": duration,
                })
            room.timer_task = asyncio.create_task(room._timer(duration))


duel_manager = DuelManager()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    token = ws.query_params.get("token", "")
    user_id = None
    try:
        from auth import verify_token
        user_id = verify_token(token)
    except Exception:
        pass
    if not user_id:
        await ws.accept()
        await ws.send_json({"type": "error", "message": "Invalid token"})
        await ws.close()
        return

    await ws.accept()
    duel_manager.register(user_id, ws)
    await ws.send_json({"type": "connected", "userId": user_id})

    db = next(get_db())
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "find_match":
                fmt = data.get("formatId", "sprint")
                print(f"[WS] {user_id} requests find_match formatId={fmt} raw={data}")
                await duel_manager.find_match(user_id, fmt, db)

            elif msg_type == "cancel_match":
                await duel_manager.cancel_match(user_id)

            elif msg_type == "create_test_room":
                fmt = data.get("formatId", "sprint")
                await duel_manager.create_test_room(user_id, fmt, db)

            elif msg_type == "join_test_room":
                code = data.get("roomCode", "")
                await duel_manager.join_test_room(user_id, code, db)

            elif msg_type == "duel_run":
                code = data.get("code", "")
                await duel_manager.handle_run(user_id, code)

            elif msg_type == "duel_submit":
                code = data.get("code", "")
                await duel_manager.handle_submit(user_id, code, db)

            elif msg_type == "activity_update":
                activity = data.get("activity", "coding")
                await duel_manager.handle_activity(user_id, activity)

            elif msg_type == "forfeit":
                await duel_manager.handle_forfeit(user_id)

            elif msg_type == "rematch_vote":
                await duel_manager.handle_rematch(user_id, db)

    except WebSocketDisconnect:
        duel_manager.disconnect(user_id)
    except Exception:
        duel_manager.disconnect(user_id)
    finally:
        db.close()


# ── Helpers ──────────────────────────────────────────────────

def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "bio": user.bio,
        "avatar": user.avatar,
        "rating": user.rating,
        "rank": user.rank,
        "wins": user.wins,
        "losses": user.losses,
        "draws": user.draws,
        "solved": user.solved,
        "languages": user.languages or [],
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


def _problem_dict(problem: Problem) -> dict:
    return {
        "id": problem.id,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "topics": problem.topics or [],
        "acceptance": problem.acceptance,
        "description": problem.description,
        "inputFormat": problem.input_format,
        "outputFormat": problem.output_format,
        "constraints": problem.constraints or [],
        "examples": _parse_examples(problem.examples),
        "starterCode": problem.starter_code,
        "orderMatters": problem.order_matters,
        "timeLimit": problem.time_limit,
        "memoryLimit": problem.memory_limit,
    }
