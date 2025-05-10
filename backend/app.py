from flask import Flask, request, jsonify
import google.generativeai as genai
import os
from PIL import Image, ImageDraw
import requests
import io
import json

from dotenv import load_dotenv
from flask_cors import CORS
# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
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
        print("Request files:", request.files)
        print("Request form:", request.form)
        return jsonify({"error": "Invalid request. 'image' and 'plant' are required."}), 400

    image_file = request.files["image"]
    plant_name = request.form["plant"]
    print("Received plant:", plant_name)
    try:

        image = Image.open(image_file.stream)

        text_prompt = f"""The plant is {plant_name}.
                        (examine carefully) first describe the image and then tell me what its disease is, its risk level (either low, medium or high), and the actions a farmer should take, using the following JSON format:
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

                        Please provide only the JSON object in your response.
                        """
        # ...existing code for text_prompt...

        result = generate_text_from_image(image, text_prompt)
        
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"An error occurred while processing the image: {e}"}), 500

@app.route("/")
def home():
    """Home route to test the API."""
    return jsonify({"message": "Welcome to the Gemini API Flask App!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
