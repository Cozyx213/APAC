from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from PIL import Image, ImageDraw
import requests
import io
import json
import psycopg2
from dotenv import load_dotenv
from flask_cors import CORS
from news import da_news_scraper, generate_insights_from_text
# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")


DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")  # Cloud SQL Proxy uses localhost
DB_PORT = os.getenv("DB_PORT")



# Connect to the database
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        print("Connected to the database!")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None


if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it.")
genai.configure(api_key=API_KEY)


# Initialize Flask app
app = Flask(__name__)
CORS(app) 


def load_image_from_url(image_url):
    """Loads an image from a URL and returns it as a PIL Image object."""
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        image_bytes = io.BytesIO(response.content)
        img = Image.open(image_bytes)
        return img
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from URL: {e}")
        return None
    except Exception as e:
        print(f"Error opening image data: {e}")
        return None

def generate_text_from_image_url(image_url, text_prompt):
    """Fetches an image from a URL and uses it with the Gemini API."""
    image_part = load_image_from_url(image_url)
    if image_part is None:
        return {"error": "Failed to load image from URL."}

    model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
    contents = [text_prompt, image_part]

    try:
        response = model.generate_content(contents)
        result = {"response": response.text}

        if response.prompt_feedback and response.prompt_feedback.block_reason:
            result["block_reason"] = response.prompt_feedback.block_reason
            if response.prompt_feedback.safety_ratings:
                result["safety_ratings"] = [
                    {"category": rating.category, "probability": rating.probability}
                    for rating in response.prompt_feedback.safety_ratings
                ]
        return result
    except Exception as e:
        return {"error": f"An API error occurred: {e}"}
def generate_text_from_image(image_obj, text_prompt):
    """Uses a PIL Image object with the Gemini API."""
    model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
    contents = [text_prompt, image_obj]
    try:
        response = model.generate_content(contents)
        result = {"response": response.text}
        if response.prompt_feedback and response.prompt_feedback.block_reason:
            result["block_reason"] = response.prompt_feedback.block_reason
            if response.prompt_feedback.safety_ratings:
                result["safety_ratings"] = [
                    {"category": rating.category, "probability": rating.probability}
                    for rating in response.prompt_feedback.safety_ratings
                ]
        return result
    except Exception as e:
        return {"error": f"An API error occurred: {e}"}

@app.route("/generate", methods=["POST"])
def generate():
    """API endpoint to generate text from an image URL and a text prompt."""
    if "image" not in request.files or "plant" not in request.form:
        return jsonify({"error": "Invalid request. 'image' and 'plant' are required."}), 400

    image_file = request.files["image"]
    plant_name = request.form["plant"]
    print("Received plant:", plant_name)
    try:
        image = Image.open(image_file.stream)
        text_prompt = f"""The plant is {plant_name}.
                        (examine carefully) first describe the image and then tell me what its disease is, its risk level (either low, medium or high), and the actions a farmer should take, using the following JSON format:
                        Example Output:
                        {{
                        "risk_level": "low/medium/high",
                        "disease": "what exact disease",
                        "farmer_actions": [
                            "Action 1",
                            "Action 2",
                            "Action 3"
                        ]
                        }}

                        IGNORE_WHEN_COPYING_START
                        Use code with caution. Python
                        IGNORE_WHEN_COPYING_END
                        "Respond only with the JSON object" and "Do not include any additional text or formatting like '''json ... '''".
                        """
        # ...existing code for text_prompt...
        result = generate_text_from_image(image, text_prompt)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"An error occurred while processing the image: {e}"}), 500

#
@app.route("/")
def home():
    """Home route to test the API."""
    return jsonify({"message": "Welcome to the Gemini API Flask App!"})






#DATABASE

@app.route("/add_plant", methods=["POST"])
def add_plant():
    """API endpoint to add a plant to the database."""
    data = request.get_json()
    plant_name = data.get("name")
    description = data.get("description")

    if not plant_name:
        return jsonify({"error": "Plant name is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("""CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);""")
            cursor.execute(
                "INSERT INTO plants (name, description) VALUES (%s, %s)",
                (plant_name, description),
            )
            conn.commit()
        return jsonify({"message": "Plant added successfully"}), 201
    except Exception as e:
        print(f"Error inserting plant: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()


@app.route("/get_plants", methods=["GET"])
def get_plants():
    """API endpoint to retrieve all plants from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
           
            cursor.execute("SELECT id, name, description FROM plants")
            rows = cursor.fetchall()
            plants = [
                {"id": row[0], "name": row[1], "description": row[2]} for row in rows
            ]
        return jsonify(plants), 200
    except Exception as e:
        print(f"Error retrieving plants: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()



"""

gcloud scheduler jobs create http daily-flask-task \
  --schedule "0 6 * * *" \
  --http-method POST \
  --uri https://apac-app-562528254517.asia-southeast1.run.app/daily_news \
  --time-zone "Asia/Manila
"""

#"https://apac-app-562528254517.asia-southeast1.run.app"
@app.route("/daily_news", methods=['POST'])
def daily_news():
    print("Running daily news task...")
    da_news = da_news_scraper()
    print(da_news[1])
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            #cursor.execute(""" ALTER TABLE news ADD COLUMN image_url TEXT ;""")  
            cursor.execute(
                "INSERT INTO news (description,url,title, image_url) VALUES (%s, %s, %s, %s)",
                (da_news[0]["response"],da_news[1],da_news[2],da_news[3] )
            )
            conn.commit()

        return jsonify({"message": "news added successfully"}), 201
    except Exception as e:
        print(f"Error inserting news: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
       
    
    return 'Daily task executed', 200

@app.route("/get_news", methods=['GET'])
def get_news():
    """API endpoint to retrieve all news from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, description, url,title,image_url FROM news ORDER BY created_at DESC LIMIT 3;")
            rows = cursor.fetchall()
            news = [
                {"id": row[0], "description": row[1],"url": row[2],"title":row[3],"image_url":row[4]} for row in rows
            ]
        return jsonify(news), 200
    except Exception as e:
        print(f"Error retrieving news: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
