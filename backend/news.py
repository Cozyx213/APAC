import requests
from bs4 import BeautifulSoup
import time, os
import google.generativeai as genai
from dotenv import load_dotenv
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it.")
genai.configure(api_key=API_KEY)


def generate_insights_from_text(text):
      
    """Uses a PIL Image object with the Gemini API."""
    model = genai.GenerativeModel('gemini-2.0-flash')
    text_prompt = f"""**Role:** Act as an agricultural advisor.
**Task:** Analyze the news article below ({text}) to provide practical insights for farmers.

**Focus specifically on:**
1.  **Crop Security:** Identify any information related to threats (pests, diseases, climate, supply chain issues) or opportunities (new protections, resilience strategies) for crops.
2.  **Farming Practices:** Does the news suggest any need to adapt cultivation methods, technology use, or resource management?
3.  **Market Implications:** How might this news affect crop prices, demand, or input costs?
4.  **Actionable Information:** What is the most crucial takeaway a farmer could act upon or needs to monitor?
dont add stuffs like this ""Here's an agricultural advisor's assessment of the news article:"
**Output:** Synthesize your findings into a concise paragraph (20 words) summarizing the most critical points for a farmer reading this news.
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
    response = requests.get(url, headers=headers)

    soup = BeautifulSoup(response.content, 'html.parser')
    post_details = soup.findAll('a', class_='read-more')
   
       

    link = post_details[3].get('href')
    response2 = requests.get(link, headers=headers)
    soup2 = BeautifulSoup(response2.content, 'html.parser')
    article = soup2.find('article')
    title = soup2.find('h1',class_="title").text
    image = soup2.find('img', class_='attachment-post-thumbnail').get('src')
    return [generate_insights_from_text(article.text), link,title, image]
    

#https://www.rappler.com/topic/agriculture-philippines/
#https://www.rappler.com/topic/agriculture-philippines/page/2/

def rappler_news_scraper():
    url = "https://www.rappler.com/topic/agriculture-philippines/page/7/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    figure = soup.find('figure', class_='archive-article-image')
    if figure:
        a_tag = figure.find('a')
        if a_tag and a_tag.has_attr('href'):
            link = a_tag['href']
            print("Article link:", link)
            # You can also get the image URL if needed:
            img_tag = a_tag.find('img')
            if img_tag and img_tag.has_attr('src'):
                image_url = img_tag['src']
                print("Image URL:", image_url)
            response2 = requests.get(link, headers=headers)
            soup2 = BeautifulSoup(response2.content, 'html.parser')
            title = soup2.find('h1').text
            container = soup2.find('div', class_='entry-content')
            if container:
                paragraphs = container.find_all('p')
                # Extract text from each <p> tag
                texts = [p.get_text(strip=True) for p in paragraphs]
                # Join all paragraphs into a single string if needed
                full_text = "\n".join(texts)
                res = generate_insights_from_text(full_text)
                print("THIS CAME FROM GEMINI",res)
                #print(title)
                return [res,link,title,image_url]  # or return both link and image_url as needed
#https://www.da.gov.ph/aggie-trends/
def da_aggie_trends_scraper():
    url = "https://www.da.gov.ph/aggie-trends/"
    pdf_url= "https://drive.google.com/file/d/1REUw0nrYgpQbACezcYUkbrdQnUJzsOqq/view"

    response = requests.get(pdf_url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    print(soup)
def check(): #https://www.da.gov.ph/ship-with-35000-bags-of-well-milled-nfa-rice-arrives-in-cebu/
    model = genai.GenerativeModel('gemini-2.5-pro-preview-05-06')
    text_prompt = f"""give me summary of this link  https://www.da.gov.ph/ship-with-35000-bags-of-well-milled-nfa-rice-arrives-in-cebu/ """
    contents = text_prompt
    try:
        response = model.generate_content(contents)
        result = {"response": response.text}
        print(result)
    except Exception as e:
        return {"error": f"An API error occurred: {e}"}
    
if __name__ == "__main__":
    rappler_news_scraper()
    #da_aggie_trends_scraper()
    #check()