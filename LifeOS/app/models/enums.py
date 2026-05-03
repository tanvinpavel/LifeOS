import enum


class EnergyLevel(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Mood(enum.Enum):
    happy = "happy"
    neutral = "neutral"
    sad = "sad"
    angry = "angry"
    stressed = "stressed"


class AreaStatus(enum.Enum):
    good = "good"
    ok = "ok"
    bad = "bad"


class Intensity(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ProductivityLevel(enum.Enum):
    low = "0-2h"
    medium = "2-4h"
    high = "4-6h"
    extreme = "6h+"


class WeeklyStatus(enum.Enum):
    green = "green"
    yellow = "yellow"
    red = "red"