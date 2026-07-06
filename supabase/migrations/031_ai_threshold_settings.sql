-- Seed configurable AI moderation thresholds used by app/api/wall/post and
-- app/api/wall/comment.
INSERT INTO public.site_settings (key, value) VALUES
  ('ai_threshold_default', '0.55'),
  ('ai_threshold_harassment', '0.50'),
  ('ai_threshold_harassment_threatening', '0.45'),
  ('ai_threshold_hate', '0.45'),
  ('ai_threshold_hate_threatening', '0.35'),
  ('ai_threshold_violence', '0.55'),
  ('ai_threshold_violence_graphic', '0.35'),
  ('ai_threshold_sexual', '0.45'),
  ('ai_threshold_sexual_minors', '0.01'),
  ('ai_threshold_self_harm', '0.35'),
  ('ai_threshold_self_harm_intent', '0.25'),
  ('ai_threshold_self_harm_instructions', '0.20'),
  ('ai_threshold_illicit', '0.55'),
  ('ai_threshold_illicit_violent', '0.35')
ON CONFLICT (key) DO NOTHING;
