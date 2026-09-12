K_FACTOR = 32
MIN_RATING = 100
MAX_RATING = 3000


def expected_score(player_rating: float, opponent_rating: float) -> float:
    """
    Calculate expected score using ELO formula.
    Returns probability of winning (0 to 1).
    """
    return 1.0 / (1.0 + 10 ** ((opponent_rating - player_rating) / 400.0))


def calculate_rating_change(rating1: float, rating2: float, result: str) -> dict:
    """
    Calculate rating changes for both players based on match result.
    result: "player1", "player2", or "draw"
    Returns dict with new ratings and changes.
    """
    e1 = expected_score(rating1, rating2)
    e2 = expected_score(rating2, rating1)

    if result == "player1":
        s1, s2 = 1.0, 0.0
    elif result == "player2":
        s1, s2 = 0.0, 1.0
    else:
        s1, s2 = 0.5, 0.5

    change1 = K_FACTOR * (s1 - e1)
    change2 = K_FACTOR * (s2 - e2)

    new_rating1 = max(MIN_RATING, min(MAX_RATING, rating1 + change1))
    new_rating2 = max(MIN_RATING, min(MAX_RATING, rating2 + change2))

    return {
        "forPlayer1": round(change1),
        "forPlayer2": round(change2),
        "newRating1": round(new_rating1),
        "newRating2": round(new_rating2)
    }


def determine_match_result(score1: int, score2: int) -> str:
    """
    Determine match result from scores.
    Returns "player1", "player2", or "draw".
    """
    if score1 > score2:
        return "player1"
    elif score2 > score1:
        return "player2"
    else:
        return "draw"
