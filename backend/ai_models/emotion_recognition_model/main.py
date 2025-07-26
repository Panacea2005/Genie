# main.py
import takeaudio
from model import predict_emotion

def main():
    print("🎙️ Speech Emotion Recognition")
    print("Press Enter to start recording, 'quit' to exit.")

    while True:
        cmd = input(">> ").strip().lower()
        if cmd == "quit":
            print("👋 Goodbye!")
            break
        # for testing purpose please change the path to the destination .wav file
        wav_path = "recordings/audio.wav"
        # if you want to record please untag the below line
        takeaudio.record_audio(wav_path)

        print("🔍 Analyzing emotion…")
        results = predict_emotion(wav_path)

        for label, score in results:
            print(f"• {label}: {score:.4f}")
        print("\n✅ Done. Hit Enter to record again or type 'quit' to exit.\n")

if __name__ == "__main__":
    main()
