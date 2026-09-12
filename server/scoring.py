import math


def correctness_curve(pass_rate: float) -> float:
    """
    Calculate correctness score based on pass rate.
    Uses a curve that rewards getting most test cases right
    but makes it hard to get a perfect score without passing all.
    """
    if pass_rate <= 0:
        return 0.0
    if pass_rate >= 1.0:
        return 100.0

    return 100.0 * (1 - math.exp(-3 * pass_rate))


def speed_bonus(correctness_score: float, normalized_speed: float) -> float:
    """
    Calculate speed bonus based on correctness score and normalized speed.
    Speed bonus is only awarded if correctness is above a threshold.
    """
    if correctness_score < 50.0:
        return 0.0

    max_bonus = 20.0
    return max_bonus * normalized_speed * (correctness_score / 100.0)


def normalize_speed(problem_time_ms: float, match_duration_ms: float) -> float:
    """
    Normalize speed to a 0-1 scale based on problem time and match duration.
    Faster completion relative to total time gives higher score.
    """
    if match_duration_ms <= 0:
        return 0.0

    ratio = problem_time_ms / match_duration_ms
    return max(0.0, 1.0 - ratio)


def get_submission_tier(pass_rate: float, all_passed: bool) -> str:
    """
    Determine submission tier based on pass rate.
    """
    if all_passed:
        return "platinum"
    elif pass_rate >= 0.8:
        return "gold"
    elif pass_rate >= 0.5:
        return "silver"
    else:
        return "bronze"


def calculate_problem_score(
    tests_passed: int,
    tests_total: int,
    runtime_ms: float,
    problem_time_ms: float,
    match_time_ms: float,
    match_duration_ms: float
) -> dict:
    """
    Calculate score for a single problem submission.
    Returns dict with correctness, speed, total, and tier.
    """
    if tests_total == 0:
        return {
            "correctness": 0.0,
            "speed": 0.0,
            "total": 0.0,
            "tier": "bronze",
            "pass_rate": 0.0,
            "all_passed": False
        }

    pass_rate = tests_passed / tests_total
    all_passed = tests_passed == tests_total

    correctness = correctness_curve(pass_rate)
    normalized_speed = normalize_speed(problem_time_ms, match_duration_ms)
    speed = speed_bonus(correctness, normalized_speed)
    total = correctness + speed
    tier = get_submission_tier(pass_rate, all_passed)

    return {
        "correctness": round(correctness, 2),
        "speed": round(speed, 2),
        "total": round(total, 2),
        "tier": tier,
        "pass_rate": round(pass_rate, 4),
        "all_passed": all_passed
    }


def aggregate_match_score(records: list, total_problems: int) -> dict:
    """
    Aggregate scores across all problems in a match.
    Records is a list of dicts from calculate_problem_score.
    """
    if not records or total_problems == 0:
        return {
            "correctness_total": 0.0,
            "speed_total": 0.0,
            "total_score": 0.0,
            "problems_solved": 0,
            "problems_attempted": 0,
            "average_correctness": 0.0,
            "average_speed": 0.0
        }

    correctness_total = sum(r["correctness"] for r in records)
    speed_total = sum(r["speed"] for r in records)
    total_score = correctness_total + speed_total
    problems_solved = sum(1 for r in records if r["all_passed"])
    problems_attempted = len(records)

    return {
        "correctness_total": round(correctness_total, 2),
        "speed_total": round(speed_total, 2),
        "total_score": round(total_score, 2),
        "problems_solved": problems_solved,
        "problems_attempted": problems_attempted,
        "average_correctness": round(correctness_total / problems_attempted, 2) if problems_attempted > 0 else 0.0,
        "average_speed": round(speed_total / problems_attempted, 2) if problems_attempted > 0 else 0.0
    }
