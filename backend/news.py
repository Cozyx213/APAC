import requests
from bs4 import BeautifulSoup
import time
import google.generativeai as genai
def generate_insights_from_text(text):
      
    """Uses a PIL Image object with the Gemini API."""
    model = genai.GenerativeModel('gemini-2.0-flash')
    text_prompt = f"""Analyze the following news article and provide insights that would be relevant and helpful to farmers. Focus on actionable information, potential impacts on agricultural practices, market trends, and any relevant scientific or economic implications for the farming community.

News Article:
{text}


 Just summarize the response in a simple paragraph format. use 4-5 sentences.
"""
    contents = text_prompt
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
    
#https://www.da.gov.ph/category/news/
def da_news_scraper():
    url = "https://www.da.gov.ph/category/news/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)

    soup = BeautifulSoup(response.content, 'html.parser')
    post_details = soup.findAll('a', class_='read-more')
   
       

    link = post_details[2].get('href')
    response2 = requests.get(link, headers=headers)
    soup2 = BeautifulSoup(response2.content, 'html.parser')
    article = soup2.find('article')
    title = soup2.find('h1',class_="title").text
    image = soup2.find('img', class_='attachment-post-thumbnail').get('src')
    return [generate_insights_from_text(article.text), link,title, image]
    





if __name__ == "__main__":
    da_news_scraper()

