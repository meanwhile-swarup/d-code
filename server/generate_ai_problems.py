import json
import os
import sys
import argparse
from sqlalchemy import text
from database import engine, SessionLocal, Base
from models import Problem

def generate_ai_problem(db, topic="Array", difficulty="Easy"):
    """
    Template generator for automated problem creation into PostgreSQL database.
    Can be connected to OpenAI, Gemini, or DeepSeek API.
    """
    current_max_id = db.query(Problem).order_by(Problem.id.desc()).first()
    next_id = (current_max_id.id + 1) if current_max_id else 1

    sample_templates = [
        {
            "title": f"Count Occurrences of Target in {topic}",
            "difficulty": difficulty,
            "topics": [topic],
            "acceptance": 70.0,
            "description": f"Given an array of integers nums and a target integer, return how many times target appears in nums.",
            "input_format": "Array nums and target integer",
            "output_format": "Integer count",
            "constraints": ["1 <= nums.length <= 10^4"],
            "examples": [
                {"input": "nums = [1, 2, 2, 3, 2, 4], target = 2", "output": "3"},
                {"input": "nums = [1, 5, 9], target = 4", "output": "0"}
            ],
            "starter_code": "function countTarget(nums, target) {\n  \n}",
            "order_matters": True,
            "param_types": ["array", "number"],
            "return_type": "number"
        },
        {
            "title": f"Find Third Largest Element",
            "difficulty": difficulty,
            "topics": [topic],
            "acceptance": 65.0,
            "description": f"Given an array of integers nums, return the third distinct largest number. If it does not exist, return the maximum number.",
            "input_format": "Array nums",
            "output_format": "Integer",
            "constraints": ["1 <= nums.length <= 10^4"],
            "examples": [
                {"input": "nums = [3, 2, 1]", "output": "1"},
                {"input": "nums = [1, 2]", "output": "2"}
            ],
            "starter_code": "function thirdMax(nums) {\n  \n}",
            "order_matters": True,
            "param_types": ["array"],
            "return_type": "number"
        }
    ]

    import random
    p_data = random.choice(sample_templates)

    new_prob = Problem(
        id=next_id,
        title=f"{p_data['title']} #{next_id}",
        difficulty=p_data["difficulty"],
        topics=p_data["topics"],
        acceptance=p_data["acceptance"],
        description=p_data["description"],
        input_format=p_data["input_format"],
        output_format=p_data["output_format"],
        constraints=p_data["constraints"],
        examples=json.dumps(p_data["examples"]),
        starter_code=p_data["starter_code"],
        order_matters=p_data["order_matters"],
        param_types=p_data["param_types"],
        return_type=p_data["return_type"]
    )

    db.add(new_prob)
    db.commit()
    print(f"[GENERATE] Created Problem #{next_id}: {new_prob.title}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        generate_ai_problem(db, topic="Array", difficulty="Easy")
        generate_ai_problem(db, topic="String", difficulty="Medium")
    finally:
        db.close()
