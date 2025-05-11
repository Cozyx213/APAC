import requests
from bs4 import BeautifulSoup
import time

def generate_insights_from_text(text):
      
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

def da_news_scraper():
    url = "https://www.da.gov.ph/category/news/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)

    soup = BeautifulSoup(response.content, 'html.parser')

    news_items = []
    post_details = soup.find('a', class_='read-more')
    for post in post_details:
       

            link = post_details.get('href')
            news_items.append(link)
            #print(link)
            #print(post.text.split('|')[0])
            #print(post.text.split('|')[1])
            #print(post.text.split('|')[2])


            print(link,'\n\n\n\n')
            response2 = requests.get(link, headers=headers)
            soup2 = BeautifulSoup(response2.content, 'html.parser')
            article = soup2.find('article')
            print(article.text)
            '''for post in post_details:
                #(post.text.split('|')[1])  
                news_time = list(post.text.split('|')[1].split())

                time_now = list(time.strftime("%d %B %Y", time.localtime()).split())
                if int(news_time[0]) == int(time_now[0])-1:
                    print(time_now)
                    print(news_time)
            '''
da_news_scraper()
#https://www.da.gov.ph/category/news/