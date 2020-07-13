import os
from typing import TextIO

from fastapi import APIRouter, File, Response, UploadFile
from google.cloud import storage
from mysql import connector as db

dbconfig = {
    "database": os.getenv("DB_NAME") or "icfpc2019",
    "user": os.getenv("DB_USER") or "negainoido",
    "password": os.getenv("DB_PASS") or "negainoido",
    "charset": "utf8mb4",
    "collation": "utf8mb4_bin",
    "pool_name": "pool-icfpc2019",
    "host": os.getenv("DB_HOST") or "localhost",
    "port": os.getenv("DB_PORT") or "3306",
}

router = APIRouter()


@router.get("/")
async def index():
    return {"message": "hello world icfpc2019"}


def get_problem_count(cur):
    query = """
        SELECT COUNT(*) FROM problem
    """
    cur.execute(query)
    row = cur.fetchone()
    return row[0]


def get_solution_count(cur):
    query = """
        SELECT COUNT(*) FROM solution
    """
    cur.execute(query)
    row = cur.fetchone()
    return row[0]


@router.get("/problems")
async def problems(response: Response, page: int = 1):
    conn = db.connect(**dbconfig)
    page_size = 20
    page_offset = max(0, (page - 1) * page_size)
    try:
        cur = conn.cursor()
        try:
            query = """
                SELECT `name`, `description`, `url` FROM problem
                ORDER BY `name` ASC
                LIMIT {} OFFSET {}
            """.format(
                page_size, page_offset
            )
            cur.execute(query)
            result = []
            for row in cur.fetchall():
                obj = {}
                obj["name"] = row[0]
                obj["description"] = row[1]
                obj["url"] = row[2]
                result.append(obj)
            response.headers["X-Page-Size"] = str(20)
            response.headers["X-Page"] = str(page)
            response.headers["X-Total"] = str(get_problem_count(cur))
            return result
        finally:
            cur.close()
    finally:
        conn.close()


@router.get("/solutions")
async def get_solutions(response: Response, page: int = 1):
    conn = db.connect(**dbconfig)
    page_size = 20
    page_offset = max(0, (page - 1) * page_size)
    try:
        cur = conn.cursor()
        try:
            query = """
                SELECT `id`, `task_id`, `solver`, `score` FROM solution
                ORDER BY `task_id` ASC
                LIMIT %s OFFSET %s
            """
            cur.execute(query, (page_size, page_offset))
            result = []
            for row in cur.fetchall():
                obj = {}
                obj["id"] = row[0]
                obj["taskId"] = row[1]
                obj["solver"] = row[2]
                obj["score"] = row[3]
                result.append(obj)
            response.headers["X-Page-Size"] = str(20)
            response.headers["X-Page"] = str(page)
            response.headers["X-Total"] = str(get_solution_count(cur))
            return result
        finally:
            cur.close()
    finally:
        conn.close()


def upload_to_storage(from_file: TextIO, path: str, overwrite: bool = True):
    bucket_id = os.getenv("BUCKET_ID")
    client = storage.Client()
    bucket = client.bucket(bucket_id)
    blob = bucket.blob(path)
    if not overwrite and blob.exists():
        raise Exception('blob already exists: ' + path)
    blob.upload_from_file(from_file)


@router.post("/solutions")
async def post_solution(task_id: int, solver: str, file: UploadFile = File(None)):
    conn = db.connect(**dbconfig)
    try:
        cur = conn.cursor()
        try:

            query = """
                INSERT INTO solution(`task_id`, `solver`) VALUES (%s, %s)
            """
            cur.execute(query, (task_id, solver))
            conn.commit()
            id = cur.lastrowid
            filepath = "icfpc2019/solutions/solution_{}_{}.txt".format(task_id, id)
            upload_to_storage(file.file, filepath)
            update_query = """
                UPDATE solution
                  SET `solution_file` = %s
                  WHERE `id` = %s
            """
            cur.execute(update_query, (filepath, id))

            obj = {}
            obj["id"] = id
            obj["taskId"] = task_id
            obj["solver"] = solver
            obj["file"] = filepath
            return obj
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
    finally:
        conn.close()
