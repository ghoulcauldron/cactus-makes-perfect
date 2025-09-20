FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy dependency file(s)
COPY pyproject.toml /app/

# Install deps
RUN pip install --no-cache-dir fastapi==0.115.0 uvicorn[standard]==0.30.6 pydantic==2.9.2 python-jose[cryptography]==3.3.0 psycopg2-binary==2.9.9 sqlalchemy==2.0.36 alembic==1.13.2

# Copy app code (everything in this folder)
COPY . /app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
