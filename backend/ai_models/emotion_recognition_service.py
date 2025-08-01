#!/usr/bin/env python3
"""
Emotion Recognition Service for Genie AI
Provides a clean interface for emotion analysis from audio data
"""

import logging
import os
import tempfile
import base64
import io
from typing import Dict, List, Tuple, Optional
from pathlib import Path

# Import the emotion recognition model
from emotion_recognition_model.model import predict_emotion, preprocess_audio
import torch

logger = logging.getLogger(__name__)

class EmotionRecognitionService:
    """Service for analyzing emotions from audio data"""
    
    def __init__(self):
        self.model_loaded = False
        self.temp_dir = None
        self._setup_temp_directory()
        self._validate_model()
    
    def _setup_temp_directory(self):
        """Setup temporary directory for audio files"""
        try:
            self.temp_dir = tempfile.mkdtemp(prefix="genie_emotion_")
            logger.info(f"Created temporary directory for emotion analysis: {self.temp_dir}")
        except Exception as e:
            logger.error(f"Failed to create temporary directory: {e}")
            self.temp_dir = None
    
    def _validate_model(self):
        """Validate that the emotion recognition model is working"""
        try:
            # Check if required dependencies are available
            import librosa
            import soundfile as sf
            from transformers import AutoModelForAudioClassification, AutoFeatureExtractor
            
            # Test model loading
            logger.info("Validating emotion recognition model...")
            
            # Test if the model can be loaded and used
            try:
                from emotion_recognition_model.model import predict_emotion
                # Create a simple test to verify the model works
                import tempfile
                import numpy as np
                
                # Create a minimal test audio file
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                    # Generate 1 second of silence at 16kHz
                    sample_rate = 16000
                    duration = 1.0
                    samples = np.zeros(int(sample_rate * duration))
                    sf.write(tmp_file.name, samples, sample_rate)
                    
                    # Test the model
                    results = predict_emotion(tmp_file.name, top_k=1)
                    
                    # Clean up
                    try:
                        os.unlink(tmp_file.name)
                    except:
                        pass
                
                self.model_loaded = True
                logger.info("Emotion recognition model validated successfully")
                
            except Exception as model_error:
                logger.error(f"Model validation failed: {model_error}")
                self.model_loaded = False
                
        except ImportError as e:
            logger.error(f"Missing dependencies for emotion recognition: {e}")
            logger.info("To enable emotion recognition, install: pip install torch transformers librosa soundfile")
            self.model_loaded = False
        except Exception as e:
            logger.error(f"Failed to validate emotion recognition model: {e}")
            self.model_loaded = False
    
    def analyze_emotion_from_base64(self, audio_base64: str, top_k: int = 3) -> Dict:
        """
        Analyze emotion from base64 encoded audio data
        
        Args:
            audio_base64: Base64 encoded audio data
            top_k: Number of top emotions to return
            
        Returns:
            Dict containing emotion analysis results
        """
        if not self.model_loaded:
            return {
                "error": "Emotion recognition model not available",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
        
        if not self.temp_dir:
            return {
                "error": "Temporary directory not available",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
        
        try:
            # Decode base64 audio data
            audio_data = base64.b64decode(audio_base64)
            
            # Create temporary audio file
            temp_audio_path = os.path.join(self.temp_dir, f"audio_{os.getpid()}.wav")
            
            # Write audio data to temporary file
            with open(temp_audio_path, 'wb') as f:
                f.write(audio_data)
            
            # Analyze emotion
            results = self._analyze_audio_file(temp_audio_path, top_k)
            
            # Clean up temporary file
            try:
                os.remove(temp_audio_path)
            except:
                pass  # Ignore cleanup errors
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing emotion from base64 audio: {e}")
            return {
                "error": f"Failed to analyze emotion: {str(e)}",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
    
    def analyze_emotion_from_webm(self, webm_data: bytes, top_k: int = 3) -> Dict:
        """
        Analyze emotion from WebM audio data
        
        Args:
            webm_data: Raw WebM audio bytes
            top_k: Number of top emotions to return
            
        Returns:
            Dict containing emotion analysis results
        """
        if not self.model_loaded:
            return {
                "error": "Emotion recognition model not available",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
        
        if not self.temp_dir:
            return {
                "error": "Temporary directory not available",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
        
        try:
            import librosa
            import soundfile as sf
            
            # Create temporary files
            temp_webm_path = os.path.join(self.temp_dir, f"audio_{os.getpid()}.webm")
            temp_wav_path = os.path.join(self.temp_dir, f"audio_{os.getpid()}.wav")
            
            # Write WebM data to temporary file
            with open(temp_webm_path, 'wb') as f:
                f.write(webm_data)
            
            # Convert WebM to WAV using librosa
            try:
                audio, sr = librosa.load(temp_webm_path, sr=16000)
                sf.write(temp_wav_path, audio, sr)
            except Exception as e:
                logger.error(f"Failed to convert WebM to WAV: {e}")
                # Try direct analysis with the WebM file
                temp_wav_path = temp_webm_path
            
            # Analyze emotion
            results = self._analyze_audio_file(temp_wav_path, top_k)
            
            # Clean up temporary files
            for path in [temp_webm_path, temp_wav_path]:
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except:
                    pass  # Ignore cleanup errors
            
            return results
            
        except Exception as e:
            logger.error(f"Error analyzing emotion from WebM audio: {e}")
            return {
                "error": f"Failed to analyze emotion: {str(e)}",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0
            }
    
    def _analyze_audio_file(self, audio_path: str, top_k: int = 3) -> Dict:
        """
        Analyze emotion from audio file
        
        Args:
            audio_path: Path to audio file
            top_k: Number of top emotions to return
            
        Returns:
            Dict containing emotion analysis results
        """
        try:
            # Use the existing emotion recognition model
            emotion_results = predict_emotion(audio_path, top_k=top_k)
            
            # Format results
            emotions = []
            for label, score in emotion_results:
                emotions.append({
                    "emotion": label,
                    "confidence": float(score),
                    "score": float(score)
                })
            
            # Get primary emotion (highest confidence)
            primary_emotion = emotions[0] if emotions else None
            primary_confidence = primary_emotion["confidence"] if primary_emotion else 0.0
            
            # Categorize emotion for mental health context
            mental_health_category = self._categorize_emotion_for_mental_health(
                primary_emotion["emotion"] if primary_emotion else None
            )
            
            return {
                "emotions": emotions,
                "primary_emotion": primary_emotion["emotion"] if primary_emotion else None,
                "confidence": primary_confidence,
                "mental_health_category": mental_health_category,
                "analysis_timestamp": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing audio file {audio_path}: {e}")
            return {
                "error": f"Failed to analyze audio: {str(e)}",
                "emotions": [],
                "primary_emotion": None,
                "confidence": 0.0,
                "mental_health_category": "unknown"
            }
    
    def _categorize_emotion_for_mental_health(self, emotion: Optional[str]) -> str:
        """
        Categorize emotion for mental health context
        
        Args:
            emotion: Detected emotion
            
        Returns:
            Mental health category
        """
        if not emotion:
            return "unknown"
        
        emotion_lower = emotion.lower()
        
        # Map emotions to mental health categories
        if any(term in emotion_lower for term in ['sad', 'depression', 'grief', 'sorrow']):
            return "depression_risk"
        elif any(term in emotion_lower for term in ['anxiety', 'fear', 'panic', 'worry']):
            return "anxiety_risk"
        elif any(term in emotion_lower for term in ['anger', 'rage', 'fury', 'irritation']):
            return "anger_management"
        elif any(term in emotion_lower for term in ['happy', 'joy', 'content', 'pleased']):
            return "positive_mood"
        elif any(term in emotion_lower for term in ['calm', 'relaxed', 'peaceful']):
            return "stable_mood"
        elif any(term in emotion_lower for term in ['stress', 'overwhelm', 'pressure']):
            return "stress_response"
        elif any(term in emotion_lower for term in ['neutral', 'normal']):
            return "neutral_mood"
        else:
            return "other_emotion"
    
    def is_available(self) -> bool:
        """Check if emotion recognition service is available"""
        return self.model_loaded and self.temp_dir is not None
    
    def get_status(self) -> Dict:
        """Get service status information"""
        return {
            "service_name": "Emotion Recognition Service",
            "model_loaded": self.model_loaded,
            "temp_dir_available": self.temp_dir is not None,
            "temp_dir_path": self.temp_dir,
            "cuda_available": torch.cuda.is_available(),
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        }
    
    def cleanup(self):
        """Cleanup resources"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                import shutil
                shutil.rmtree(self.temp_dir)
                logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
            except Exception as e:
                logger.error(f"Failed to cleanup temporary directory: {e}")

# Global instance
_emotion_service = None

def get_emotion_service() -> EmotionRecognitionService:
    """Get global emotion recognition service instance"""
    global _emotion_service
    if _emotion_service is None:
        _emotion_service = EmotionRecognitionService()
    return _emotion_service

def initialize_emotion_service() -> bool:
    """Initialize emotion recognition service"""
    try:
        service = get_emotion_service()
        logger.info(f"Emotion recognition service initialized: {service.is_available()}")
        return service.is_available()
    except Exception as e:
        logger.error(f"Failed to initialize emotion recognition service: {e}")
        return False 