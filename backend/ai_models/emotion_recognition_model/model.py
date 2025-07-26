# model.py
import numpy as np
import librosa
import torch
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor

# Load model & extractor once at import time
MODEL_ID = "firdhokk/speech-emotion-recognition-with-openai-whisper-large-v3"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = AutoModelForAudioClassification.from_pretrained(MODEL_ID).to(device)
feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_ID, do_normalize=True)
id2label = model.config.id2label

def preprocess_audio(audio_path: str, max_duration: float = 30.0):
    audio, sr = librosa.load(audio_path, sr=feature_extractor.sampling_rate)
    max_length = int(sr * max_duration)
    if len(audio) > max_length:
        audio = audio[:max_length]
    else:
        audio = np.pad(audio, (0, max_length - len(audio)), mode="constant")

    inputs = feature_extractor(
        audio,
        sampling_rate=sr,
        max_length=max_length,
        truncation=True,
        return_tensors="pt",
    )
    return {k: v.to(device) for k, v in inputs.items()}

def predict_emotion(audio_path: str, top_k: int = 5):
    """
    Returns the top_k (label, score) tuples for the given WAV file.
    """
    inputs = preprocess_audio(audio_path)
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits.squeeze(0)
    probs = torch.softmax(logits, dim=-1).cpu().numpy()
    top_indices = np.argsort(probs)[::-1][:top_k]
    return [(id2label[idx], float(probs[idx])) for idx in top_indices]
