DUEL_FORMATS = [
    {"id": "sprint", "name": "Sprint", "problems": 5, "duration_minutes": 10},
    {"id": "standard", "name": "Standard", "problems": 10, "duration_minutes": 30},
    {"id": "extended", "name": "Extended", "problems": 15, "duration_minutes": 60},
]


def get_format_by_id(format_id: str) -> dict:
    """Get duel format by ID"""
    for fmt in DUEL_FORMATS:
        if fmt["id"] == format_id:
            return fmt
    return None


def get_format_duration_seconds(format_id: str) -> int:
    """Get format duration in seconds"""
    fmt = get_format_by_id(format_id)
    if fmt:
        return fmt["duration_minutes"] * 60
    return 0
