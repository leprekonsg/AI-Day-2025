import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

# --- CONFIGURATION ---
SERVICE_ACCOUNT_KEY_PATH = "serviceAccountKey.json"
EXCEL_FILE_PATH = "questions_upload.xlsx" # Use a new Excel file for this
COLLECTION_NAME = "poll_responses" # A NEW, dedicated collection
# --- END OF CONFIGURATION ---


def initialize_firestore():
    """Initializes the Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized successfully.")
            return firestore.client()
        except Exception as e:
            print(f"🔥 Error initializing Firebase: {e}")
            return None
    else:
        print("ℹ️ Firebase Admin SDK already initialized.")
        return firestore.client()

def upload_poll_responses(db, excel_path):
    """Reads Yes/No poll responses from Excel and uploads them to Firestore."""
    if not db:
        return

    try:
        df = pd.read_excel(excel_path, engine='openpyxl')
        print(f"📄 Successfully read {len(df)} rows from {excel_path}.")
    except FileNotFoundError:
        print(f"🔥 Error: The file was not found at '{excel_path}'. Please check the path.")
        return
    except Exception as e:
        print(f"🔥 Error reading Excel file: {e}")
        return

    collection_ref = db.collection(COLLECTION_NAME)
    question_columns = ['Q1', 'Q2', 'Q3']
    upload_count = 0

    for index, row in df.iterrows():
        response_data = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "source": "manual-upload"
        }
        has_response = False

        for i, col in enumerate(question_columns):
            response = str(row.get(col, '')).lower().strip()
            question_key = f"q{i+1}" # Creates q1, q2, q3

            if response in ['yes', 'y']:
                response_data[question_key] = 'yes'
                has_response = True
            elif response in ['no', 'n']:
                response_data[question_key] = 'no'
                has_response = True
            else:
                response_data[question_key] = 'no_response'

        # Only upload if at least one question was answered
        if has_response:
            try:
                collection_ref.add(response_data)
                upload_count += 1
            except Exception as e:
                print(f"🔥 Firestore upload failed for row {index + 2}: {e}")

    print(f"\n--- Upload Complete ---")
    print(f"Total valid response rows uploaded: {upload_count}")


if __name__ == "__main__":
    firestore_db = initialize_firestore()
    upload_poll_responses(firestore_db, EXCEL_FILE_PATH)