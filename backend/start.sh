#!/usr/bin/env bash
export TZ=Asia/Jakarta
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload