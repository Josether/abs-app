import asyncio
from typing import Callable, Awaitable

_lock = asyncio.Lock()
_queue: asyncio.Queue[Callable[[], Awaitable[None]]] = asyncio.Queue()

async def submit(job_coro: Callable[[], Awaitable[None]]):
    await _queue.put(job_coro)
    asyncio.create_task(_runner())

async def _runner():
    if _lock.locked(): 
        return
    async with _lock:
        while not _queue.empty():
            coro = await _queue.get()
            try:
                await coro()
            finally:
                _queue.task_done()
