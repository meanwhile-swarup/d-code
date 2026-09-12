from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: Optional[str] = ""


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    name: str
    bio: str
    avatar: str
    rating: int
    rank: int
    wins: int
    losses: int
    draws: int
    solved: int
    languages: List[str]
    created_at: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    languages: Optional[List[str]] = None


class ProblemResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    topics: List[str]
    acceptance: float
    description: str
    input_format: str
    output_format: str
    constraints: List[str]
    examples: List[dict]
    starter_code: str
    order_matters: bool
    param_types: Optional[List[str]] = []
    return_type: Optional[str] = "auto"
    is_mutation: Optional[bool] = False
    mutate_arg: Optional[int] = 0
    time_limit: int
    memory_limit: int


class ProblemListResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    topics: List[str]
    acceptance: float
    solved: Optional[bool] = False
    attempted: Optional[bool] = False
    is_daily: Optional[bool] = False


class SubmissionCreate(BaseModel):
    problem_id: int
    code: str
    language: str = "javascript"


class SubmissionResponse(BaseModel):
    id: str
    user_id: str
    problem_id: int
    code: str
    language: str
    status: str
    runtime: int
    tests_passed: int
    tests_total: int
    created_at: Optional[str] = None


class DuelCreate(BaseModel):
    type: str = "ranked"
    format: str = "sprint"
    problem_id: Optional[int] = None
    opponent_id: Optional[str] = None


class DuelResponse(BaseModel):
    id: str
    type: str
    format: str
    player1_id: str
    player2_id: Optional[str]
    status: str
    winner_id: Optional[str]
    problem_id: Optional[int]
    time_limit: int
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class FriendResponse(BaseModel):
    id: str
    username: str
    avatar: str
    rating: int
    status: str
    friendship_id: Optional[str] = None


class FriendRequestResponse(BaseModel):
    friends: List[FriendResponse]
    pending_received: List[FriendResponse]
    pending_sent: List[FriendResponse]


class PuzzleResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    language: str
    code: str
    question: str
    answers: List[str]
    correct_index: int
    xp: int
    explanation: str


class PuzzleAttemptCreate(BaseModel):
    answer: int


class PuzzleAttemptResponse(BaseModel):
    id: str
    user_id: str
    puzzle_id: int
    answer: int
    correct: bool
    created_at: Optional[str] = None


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    condition_key: str
    earned: Optional[bool] = False
    earned_at: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    type: str
    details: str
    created_at: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    id: str
    username: str
    avatar: str
    rating: int
    wins: int
    losses: int
    tier: str
    rank_change: Optional[str] = "same"
