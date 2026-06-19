FROM python:3.12-slim
WORKDIR /app
COPY aegis/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY aegis/backend /app
COPY data /data
ENV AEGIS_TRANSPORT=streamable-http \
    AEGIS_HOST=0.0.0.0 \
    AEGIS_PORT=8000 \
    AEGIS_DATA_DIR=/data
EXPOSE 8000
CMD ["python", "-m", "aegis.server"]
