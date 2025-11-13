from pathlib import Path
def keep_last_n(paths: list[str], n: int) -> list[str]:
    # return paths to delete
    by_mtime = sorted([Path(p) for p in paths if Path(p).exists()], key=lambda p: p.stat().st_mtime, reverse=True)
    return [str(p) for p in by_mtime[n:]]
