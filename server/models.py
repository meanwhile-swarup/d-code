import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Text, Boolean, DateTime,
    ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, default="")
    bio = Column(Text, default="")
    avatar = Column(String, default="")
    rating = Column(Integer, default=1000)
    rank = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    solved = Column(Integer, default=0)
    languages = Column(JSON, default=["JavaScript"])
    created_at = Column(DateTime, default=utcnow)

    submissions = relationship("Submission", back_populates="user")
    duels_as_player1 = relationship("Duel", foreign_keys="Duel.player1_id", back_populates="player1")
    duels_as_player2 = relationship("Duel", foreign_keys="Duel.player2_id", back_populates="player2")
    duel_moves = relationship("DuelMove", back_populates="user")
    friends_sent = relationship("Friend", foreign_keys="Friend.user_id", back_populates="user")
    friends_received = relationship("Friend", foreign_keys="Friend.friend_id", back_populates="friend")
    puzzle_attempts = relationship("PuzzleAttempt", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    topics = Column(JSON, default=[])
    acceptance = Column(Float, default=0.0)
    description = Column(Text, default="")
    input_format = Column(Text, default="")
    output_format = Column(Text, default="")
    constraints = Column(JSON, default=[])
    examples = Column(JSON, default=[])
    starter_code = Column(Text, default="")
    order_matters = Column(Boolean, default=True)
    param_types = Column(JSON, default=[])
    return_type = Column(String, default="auto")
    is_mutation = Column(Boolean, default=False)
    mutate_arg = Column(Integer, default=0)
    time_limit = Column(Integer, default=30)
    memory_limit = Column(Integer, default=256)

    submissions = relationship("Submission", back_populates="problem")
    duels = relationship("Duel", back_populates="problem")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    code = Column(Text, default="")
    language = Column(String, default="javascript")
    status = Column(String, default="pending")
    runtime = Column(Integer, default=0)
    tests_passed = Column(Integer, default=0)
    tests_total = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")


class Duel(Base):
    __tablename__ = "duels"

    id = Column(String, primary_key=True, default=gen_uuid)
    type = Column(String, default="ranked")
    format = Column(String, default="sprint")
    player1_id = Column(String, ForeignKey("users.id"), nullable=False)
    player2_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="waiting")
    winner_id = Column(String, ForeignKey("users.id"), nullable=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=True)
    time_limit = Column(Integer, default=900)
    created_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)

    player1 = relationship("User", foreign_keys=[player1_id], back_populates="duels_as_player1")
    player2 = relationship("User", foreign_keys=[player2_id], back_populates="duels_as_player2")
    problem = relationship("Problem", back_populates="duels")
    moves = relationship("DuelMove", back_populates="duel")


class DuelMove(Base):
    __tablename__ = "duel_moves"

    id = Column(String, primary_key=True, default=gen_uuid)
    duel_id = Column(String, ForeignKey("duels.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    code = Column(Text, default="")
    submitted_at = Column(DateTime, default=utcnow)
    result = Column(Text, nullable=True)

    duel = relationship("Duel", back_populates="moves")
    user = relationship("User", back_populates="duel_moves")


class Friend(Base):
    __tablename__ = "friends"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    friend_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="friends_sent")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friends_received")


class Puzzle(Base):
    __tablename__ = "puzzles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    language = Column(String, default="JavaScript")
    code = Column(Text, default="")
    question = Column(Text, default="")
    answers = Column(JSON, default=[])
    correct_index = Column(Integer, default=0)
    xp = Column(Integer, default=10)
    explanation = Column(Text, default="")

    attempts = relationship("PuzzleAttempt", back_populates="puzzle")


class PuzzleAttempt(Base):
    __tablename__ = "puzzle_attempts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    puzzle_id = Column(Integer, ForeignKey("puzzles.id"), nullable=False)
    answer = Column(Integer, nullable=False)
    correct = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="puzzle_attempts")
    puzzle = relationship("Puzzle", back_populates="attempts")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    icon = Column(String, default="")
    condition_key = Column(String, default="")

    user_achievements = relationship("UserAchievement", back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(String, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    details = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="activity_logs")
