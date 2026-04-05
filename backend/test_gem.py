import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
import re

load_dotenv()
_key = os.environ.get('GEMINI_API_KEY')
if not _key:
  raise RuntimeError('GEMINI_API_KEY not set in environment')

# Configure the genai library globally and create a client
genai.configure(api_key=_key)
client = genai.Client()

prompt = '''
You are an expert data analyst AI. Analyze these dataset summary statistics:
[MOCK STATS]

Generate exactly 4 actionable insights. Your response MUST be a valid JSON array of objects with this structure:
[
  {
    "title": "Short title",
    "desc": "Detailed 2 sentence explanation of the finding",
    "type": "opportunity, observation, recommendation, or alert",
    "confidence": 80 to 99
  }
]
Do not wrap the JSON in markdown blocks. Return ONLY the raw JSON array.
'''

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    
    raw_text = response.text.replace('```json', '').replace('```', '').strip()
    print('RAW:', raw_text)
    match = re.search(r'\[.*\]', raw_text, re.DOTALL)
    if match:
        print('PARSED:', json.loads(match.group(0)))
    else:
        print('PARSED FALLBACK:', json.loads(raw_text))
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR:', str(e))
