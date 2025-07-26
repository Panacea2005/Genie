# takeaudio.py
import os
import numpy as np
import sounddevice as sd
import soundfile as sf

def record_audio(output_path: str, samplerate: int = 16000, channels: int = 1):
    """
    Record from the default microphone until the user types 'stop' and presses Enter.
    Saves the result as a WAV file at output_path.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print("Recording... Type 'stop' and press Enter to finish.")
    frames = []

    def callback(indata, frames_count, time_info, status):
        if status:
            print(f"⚠️  {status}")
        frames.append(indata.copy())

    with sd.InputStream(samplerate=samplerate, channels=channels, callback=callback):
        while True:
            if input().strip().lower() == "stop":
                break

    audio = np.concatenate(frames, axis=0)
    sf.write(output_path, audio, samplerate)
    print(f"✅  Saved recording to {output_path}")
