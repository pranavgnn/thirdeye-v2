CREATE TABLE IF NOT EXISTS violation_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  violationId UUID NOT NULL UNIQUE REFERENCES violation_reports(id) ON DELETE CASCADE,
  embedding vector(1536),
  similarity_score DECIMAL(3, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violation_embeddings_violation_id ON violation_embeddings(violationId);
CREATE INDEX idx_violation_embeddings_similarity ON violation_embeddings USING ivfflat (embedding vector_cosine_ops);