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
from news import da_news_scraper, generate_insights_from_text , rappler_news_scraper
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
    #[description, url, title, image_url]
    rappler_news = rappler_news_scraper()
    print(da_news[1])
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            #cursor.execute(""" \d+ tablename""")
            
            cursor.execute("""
                                INSERT INTO news (description, url, title, image_url)
                                VALUES (%s, %s, %s, %s)
                                ON CONFLICT (title) DO NOTHING
                                """,
            (da_news[0]["response"], da_news[1], da_news[2].strip(), da_news[3])
        )
            cursor.execute("""
            INSERT INTO news (description, url, title, image_url)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (title) DO NOTHING
            """,
            (rappler_news[0]["response"], rappler_news[1], rappler_news[2].strip(), rappler_news[3])
        )
            conn.commit()

        return jsonify({"message": "news added successfully"}), 201
    except Exception as e:
        print(f"Error inserting news: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
       
    
        return 'Daily task executed', 200
    
    """
    CREATE TABLE IF NOT EXISTS weekly_suggestions (
    id SERIAL PRIMARY KEY,            
    suggestion TEXT NOT NULL,          
    created_at TIMESTAMP DEFAULT NOW(),
);
    """
@app.route("/weekly_suggestions", methods=['GET'])
def weekly_suggestions():
    """API endpoint to generate weekly suggestions."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        # 1) Fetch latest 10 logs
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT plant, log_date, watered, fertilizer_applied,
                       disease, height_cm, growth_stage, note
                FROM plant_log
                ORDER BY log_date DESC
                LIMIT 10
            """)
            rows = cursor.fetchall()

        if not rows:
            return jsonify({"error": "No logs available to generate suggestions"}), 404

        logs = [
            {
                "plant": r[0],
                "log_date": r[1].isoformat() if hasattr(r[1], "isoformat") else str(r[1]),
                "watered": r[2],
                "fertilizer_applied": r[3],
                "disease": r[4],
                "height_cm": float(r[5]) if r[5] is not None else None,
                "growth_stage": r[6],
                "note": r[7],
            }
            for r in rows
        ]

        # 2) Build prompt
        prompt = (
            f"""
            you are a plant expert and given this data below, what suggestions can you give to optimize plant growth, only put the action steps and skip the explanations, limit to 10 words per sentence, use bullet points, and do not add necessary sentences like "Here is a step-by-step plan to optimize growth"
            f"{json.dumps(logs, indent=2)}\n"
            """
           
        )

        # 3) Call Gemini API
        try:
            model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
            response = model.generate_content([prompt])
            suggestion_text = response.text.strip()
        except Exception as api_err:
            return jsonify({
                "error": "Failed to generate suggestions from Gemini API",
                "details": str(api_err)
            }), 502

        # 4) Store suggestion
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO weekly_suggestions (suggestion)
                    VALUES (%s)
                """, (suggestion_text,))
            conn.commit()
        except Exception as db_err:
            return jsonify({
                "error": "Failed to store weekly suggestion",
                "details": str(db_err)
            }), 500

        return jsonify({"suggestion": suggestion_text}), 201

    except Exception as unexpected:
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(unexpected)
        }), 500

    finally:
        conn.close()



@app.route("/get_weekly_suggestion", methods=['GET'])
def get_weekly_suggestions():
    """API endpoint to retrieve all weekly suggestions from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, suggestion FROM weekly_suggestions ORDER BY created_at DESC LIMIT 1;")
            row = cursor.fetchone()
            suggestions = {"id": row[0], "suggestion": row[1]} if row else None
            print("suggestions", suggestions)
        if not suggestions:
            return jsonify({"message": "No suggestions available"}), 404
        return jsonify(suggestions), 200
    except Exception as e:
        print(f"Error retrieving suggestions: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()




@app.route("/get_news", methods=['GET'])
def get_news():
    """API endpoint to retrieve all news from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
          
            cursor.execute("SELECT id, description, url,title,image_url FROM news ORDER BY created_at DESC LIMIT 20;")
            rows = cursor.fetchall()
            news = [
                {"id": row[0], "description": row[1],"url": row[2],"title":row[3],"image_url":row[4]} for row in rows
            ]
        return jsonify(news), 200
    except Exception as e:
        print(f"Error retrieving plan: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
@app.route("/post_logs", methods=['POST'])
def post_logs():
    """API endpoint to add logs to the database."""
    data = request.get_json()
    fertilizer_applied = data.get("fertilizer")
    plant = data.get("plant")
    watered = data.get("watered")
    height_cm= data.get("height")
    disease = data.get("disease")
    growth_stage = data.get("stage")
    note = data.get("note")
    print("Received plant:", plant)
    print("Received fertilizer:", fertilizer_applied)
    print("Received watered:", watered)
    print("Received height:", height_cm)
    print("Received disease:", disease)
    print("Received growth stage:", growth_stage)
    print("Received note:", note)
    # Validate input data

    if not plant:
        return jsonify({"error": "Plant name is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            #ursor.execute("ALTER TABLE plant_log ADD COLUMN note TEXT;")
            cursor.execute("""
    CREATE TABLE IF NOT EXISTS plant_log ( 
        id SERIAL PRIMARY KEY, 
        plant TEXT,
        log_date TIMESTAMP DEFAULT NOW(), 
        watered BOOLEAN DEFAULT FALSE, 
        fertilizer_applied TEXT, 
        disease TEXT,
        height_cm NUMERIC(5,2), 
        growth_stage TEXT
    );
""")
            
            cursor.execute("""
                INSERT INTO plant_log (plant, watered, fertilizer_applied, height_cm, disease, growth_stage,note)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (plant, watered, fertilizer_applied, height_cm, disease, growth_stage, note.strip()))
            
            
            conn.commit()
        return jsonify({"message": "Logs added successfully"}), 201
    except Exception as e:
        print(f"Error inserting logs: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()

@app.route("/get_logs", methods=['GET'])
def get_logs():
    """API endpoint to retrieve all logs from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
          
            cursor.execute(
                    "SELECT id, plant, log_date, watered, fertilizer_applied, disease, height_cm, growth_stage, note"
                    " FROM plant_log ORDER BY log_date DESC LIMIT 10;"
                )
            rows = cursor.fetchall()
            logs = [
                {"id": row[0], "plant": row[1], "log_date": row[2], "watered": row[3], "fertilizer_applied": row[4], "disease": row[5], "height_cm": row[6], "growth_stage": row[7],"note": row[8]} for row in rows
            ]
            print(logs)
        return jsonify(logs), 200
    except Exception as e:
        print(f"Error retrieving logs: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
@app.route("/add_plant", methods=["POST"])
def add_plant():
    """API endpoint to add a plant to the database."""
    data = request.get_json()
    plant_name = data.get("name")
    

    if not plant_name:
        return jsonify({"error": "Plant name is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            
            cursor.execute("""
                 
            """)
            cursor.execute(
                "INSERT INTO plants (name) VALUES (%s)",
                (plant_name,)
            )
            conn.commit()
        return jsonify({"message": "Plant added successfully"}), 201
    except Exception as e:
        print(f"Error inserting plant: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()


@app.route("/get_plant", methods=["GET"])
def get_plant():
    """API endpoint to retrieve all plants from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name FROM plants")
            rows = cursor.fetchall()
            plants = [
                {"id": row[0], "name": row[1]} for row in rows
            ]
        return jsonify(plants), 200
    except Exception as e:
        print(f"Error retrieving plants: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()

def generate_demand():
    text_prompt = (
        "Based on this news report, give me list of crops that have a chance of "
        "increasing in price, decreasing price, and only send json, do not include "
        "any introduction for the response, do not put neutral crops, also, every "
        "crop must have estimated price in pesos with float data type and an analysis "
        "why the sentiment is such; name the key for price 'price' and the key for "
        "analysis 'analysis'; the key for increasing prices must be 'increasing' and "
        "the key for decreasing prices must be 'decreasing' while the crop name is in "
        "the key 'crop'. Furthermore, do not put the predicted price, instead, put "
        "the current price but for the price do not be limited by the data I gave. "
        "Lastly, do not put the news ID where the sentiment came from."
    )
    res = requests.get("https://apac-app-562528254517.asia-southeast1.run.app/get_news")
    if res.ok and res.text:
        try:
            result = res.json()
        except json.JSONDecodeError:
            result = {"error": "Invalid JSON from news endpoint"}
    else:
        model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
        response = model.generate_content([text_prompt])
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = {"response": text}
        with open('temp.json', 'w') as f:
            json.dump(result, f, indent=1)
    return result


def generate_demand_final():
    text_prompt = (
        "Based on this news report, give me list of crops that have a chance of "
        "increasing in price, decreasing price, and only send json, do not include "
        "any introduction for the response, do not put neutral crops, also, every "
        "crop must have estimated price in pesos with float data type and an analysis "
        "why the sentiment is such; name the key for price 'price' and the key for "
        "analysis 'analysis'; the key for increasing prices must be 'increasing' and "
        "the key for decreasing prices must be 'decreasing' while the crop name is in "
        "the key 'crop'. Furthermore, do not put the predicted price, instead, put "
        "the current price but for the price do not be limited by the data I gave. "
        "Lastly, do not put the news ID where the sentiment came from."
    )
    url = "http://127.0.0.1:5000/get_news"  # Correctly define the URL for fetching news

    try:
        # Fetch the latest 20 news articles
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for HTTP issues
        news_data = response.json()

        if not news_data or not isinstance(news_data, list):
            raise ValueError("Invalid news data received from the API")

        # Append the news data to the prompt
        text_prompt += "\n" + json.dumps(news_data, indent=2)

        # Call the Gemini API to generate demand
        model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
        contents = [text_prompt]
        response = model.generate_content(contents)

        # Clean up the response text
        temp = response.text
        cleaned_response = temp.replace("```json", "").replace("```", "").strip()

        # Return the cleaned response as a dictionary
        result = {"response": cleaned_response}
        return result

    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {e}")
        return None
    except Exception as e:
        print(f"Error generating demand: {e}")
        return None
@app.route("/post_demand", methods=["POST"])
def post_demand():
    """API endpoint to add demand to the database."""
    demand = generate_demand_final()

    if not demand or "response" not in demand:
        return jsonify({"error": "Failed to generate demand"}), 500

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            # Create the demand table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS demand ( 
                    id SERIAL PRIMARY KEY, 
                    json TEXT
                );
            """)
            # Insert the generated demand into the database
            cursor.execute(
                "INSERT INTO demand (json) VALUES (%s)",
                (json.dumps(demand),)
            )
            conn.commit()
        return jsonify({"message": "Demand added successfully"}), 201
    except Exception as e:
        print(f"Error inserting demand: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
@app.route("/get_demand", methods=["GET"])
def get_demand():
    """API endpoint to retrieve the latest demand from the database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, json FROM demand ORDER BY id DESC LIMIT 1;")
            row = cursor.fetchone()
            if not row:
                return jsonify({"message": "No demand available"}), 404
            demand = {"id": row[0], "json": row[1]}
        return jsonify(demand), 200
    except Exception as e:
        print(f"Error retrieving demand: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500
    finally:
        conn.close()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
