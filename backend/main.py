from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import pandas as pd
import numpy as np
import io
import json
from sklearn.linear_model import LinearRegression
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
app = FastAPI(title="DecisionGPT API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
datasets = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Load GEMINI API key from environment and configure the Google generative AI client globally
load_dotenv()
_gemini_key = os.environ.get("GEMINI_API_KEY")
if _gemini_key:
    try:
        genai.configure(api_key=_gemini_key)
    except Exception:
        # Non-fatal: if configure fails, per-request code will still try to instantiate the client
        pass

def verify_token(token: str = Depends(oauth2_scheme)):
    if token != "decision-gpt-secure-token":
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    return token

class ChatMessage(BaseModel):
    message: str
    dataset_id: str

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username == "admin" and form_data.password == "admin":
        return {"access_token": "decision-gpt-secure-token", "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Incorrect username or password")

@app.get("/")
def read_root():
    return {"message": "Welcome to DecisionGPT API"}
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), token: str = Depends(verify_token)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        content = await file.read()
        # Basic security check: ensure it can be decoded and isn't malformed
        try:
            content_str = content.decode('utf-8', errors='replace')
            if "<script>" in content_str.lower() or "javascript:" in content_str.lower():
                raise HTTPException(status_code=400, detail="Potential malicious content detected")
        except:
            pass
        
        df = pd.read_csv(io.BytesIO(content))
        # Basic validation
        if len(df.columns) == 0:
            raise HTTPException(status_code=400, detail="CSV file has no valid columns")
            
        df = df.fillna('')
        dataset_id = file.filename
        datasets[dataset_id] = df
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/datasets")
def list_datasets(token: str = Depends(verify_token)):
    return [{"id": k, "rows": len(v), "columns": list(v.columns)} for k, v in datasets.items()]
@app.get("/api/data/{dataset_id}/summary")
def get_dataset_summary(dataset_id: str, token: str = Depends(verify_token)):
    if dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = datasets[dataset_id]
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    date_cols = df.select_dtypes(include=['datetime']).columns.tolist()
    revenue_col = next((c for c in numeric_cols if 'revenue' in c.lower() or 'sales' in c.lower() or 'total' in c.lower()), None)
    if not revenue_col and numeric_cols:
        revenue_col = numeric_cols[-1]
    total_revenue = float(df[revenue_col].sum()) if revenue_col else 0
    total_transactions = len(df)
    customer_col = next((c for c in df.columns if 'customer' in c.lower() or 'id' in c.lower()), None)
    active_customers = len(df[customer_col].unique()) if customer_col else 0
    product_col = next((c for c in ['Product', 'Item', 'Category'] if c in df.columns), None)
    if product_col:
        top_product = df[product_col].value_counts().index[0]
    else:
        top_product = "N/A"
    preview = df.head(10).to_dict(orient='records')
    return {
        "metrics": {
            "total_revenue": total_revenue,
            "total_transactions": total_transactions,
            "active_customers": active_customers,
            "top_product": str(top_product)
        },
        "preview": preview,
        "columns": list(df.columns),
        "types": {c: str(df[c].dtype) for c in df.columns}
    }
@app.get("/api/data/{dataset_id}/chart-data")
def get_chart_data(dataset_id: str, x_col: str, y_col: str, agg: str = "sum", sort: bool = True, token: str = Depends(verify_token)):
    if dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = datasets[dataset_id]
    if x_col not in df.columns or y_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid columns")
    try:
        y_data = pd.to_numeric(df[y_col], errors='coerce')
        valid_idx = y_data.notna()
        if agg == "sum":
            grouped = y_data[valid_idx].groupby(df[x_col][valid_idx]).sum()
        elif agg == "mean":
            grouped = y_data[valid_idx].groupby(df[x_col][valid_idx]).mean()
        else:
            grouped = y_data[valid_idx].groupby(df[x_col][valid_idx]).count()
        if sort:
            grouped = grouped.sort_values(ascending=False)
        grouped = grouped.head(20)
        return [{"name": str(k), "value": float(v)} for k, v in grouped.items()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error grouping data: " + str(e))
@app.get("/api/data/{dataset_id}/predictions")
def get_predictions(dataset_id: str, date_col: str, value_col: str, periods: int = 7, token: str = Depends(verify_token)):
    if dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = datasets[dataset_id].copy()
    if date_col not in df.columns or value_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid columns for prediction")
    try:
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col, value_col])
        df[value_col] = pd.to_numeric(df[value_col], errors='coerce')
        daily_data = df.groupby(df[date_col].dt.date)[value_col].sum().reset_index()
        daily_data[date_col] = pd.to_datetime(daily_data[date_col])
        if len(daily_data) < 3:
            return {"error": "Not enough data points for prediction"}
            
        # Advanced Hybrid Model: Detrended Random Forest
        from sklearn.ensemble import RandomForestRegressor
        
        # Feature Engineering
        daily_data['trend'] = np.arange(len(daily_data))
        daily_data['dow'] = daily_data[date_col].dt.dayofweek
        daily_data['month'] = daily_data[date_col].dt.month
        daily_data['is_weekend'] = daily_data['dow'].apply(lambda x: 1 if x >= 5 else 0)
        
        trend_X = daily_data[['trend']].values
        y = daily_data[value_col].values
        
        # 1. Fit Linear Regression to find the overall non-cyclical trend
        trend_model = LinearRegression()
        trend_model.fit(trend_X, y)
        base_trend_pred = trend_model.predict(trend_X)
        
        # 2. Isolate the Seasonal Residuals (noise around the trend baseline)
        residuals = y - base_trend_pred
        
        # 3. Fit Random Forest exactly to the seasonal cyclic features
        seasonal_features = daily_data[['dow', 'month', 'is_weekend']].values
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_model.fit(seasonal_features, residuals)
        
        last_date = pd.to_datetime(daily_data[date_col].iloc[-1])
        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, periods + 1)]
        future_df = pd.DataFrame({date_col: future_dates})
        
        future_df['trend'] = np.arange(len(daily_data), len(daily_data) + periods)
        future_df['dow'] = future_df[date_col].dt.dayofweek
        future_df['month'] = future_df[date_col].dt.month
        future_df['is_weekend'] = future_df['dow'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Predict Future Trend and Future Residuals, then Ensemble
        future_trend_pred = trend_model.predict(future_df[['trend']].values)
        future_seasonal_pred = rf_model.predict(future_df[['dow', 'month', 'is_weekend']].values)
        
        future_y = future_trend_pred + future_seasonal_pred
        # Floor predictions logically at 0
        future_y = np.maximum(future_y, 0)
        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, periods + 1)]
        historical = [{"date": str(d), "actual": float(v), "predicted": None} for d, v in zip(daily_data[date_col], y)]
        forecast = [{"date": str(d.date()), "actual": None, "predicted": float(v)} for d, v in zip(future_dates, future_y)]
        return {
            "historical": historical[-30:], # Last 30 days
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/{dataset_id}/forecast-validation")
def get_forecast_validation(dataset_id: str, value_col: str, token: str = Depends(verify_token)):
    if dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = datasets[dataset_id]
    
    try:
        import os
        from dotenv import load_dotenv
        import google.generativeai as genai

        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing.")

        # genai already configured at startup when available; instantiate client without passing the key
        client = genai.Client()
        
        summary_stats = df.describe(include='all').to_string()
        
        prompt = f"""
        You are a seasoned Business Operations Director analyzing a corporate forecast for the `{value_col}` metric.
        
        Dataset Summary:
        {summary_stats[:2000]}
        
        Write exactly 2 concise, highly professional bullet points explaining why this forecast trajectory is realistic, trustworthy, and highly relevant for the company's operational planning. 
        
        CRITICAL RULES:
        - Write purely from a Business Strategy point of view (e.g., "By accounting for our historical baseline alongside recurring weekly traffic volume dips...").
        - DO NOT mention "AI", "Machine Learning", "Random Forest", "Models", or complex mathematical jargon.
        - Relate the explanation directly back to the metrics and trends seen in the Dataset Summary provided above to show it is tailored to this specific company.
        - Do not write any intro/outro text, just the bullet points starting with appropriate emojis.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        return {"validation": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation Error: {str(e)}")

@app.get("/api/data/{dataset_id}/insights")
def generate_insights(dataset_id: str, token: str = Depends(verify_token)):
    if dataset_id not in datasets:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = datasets[dataset_id]
    
    try:
        import os
        import json
        from dotenv import load_dotenv
        import google.generativeai as genai

        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing.")

        client = genai.Client()
        
        summary_stats = df.describe(include='all').to_string()
        
        prompt = f"""
        You are an expert data analyst AI. Analyze these dataset summary statistics:
        {summary_stats[:2000]}
        
        Generate exactly 4 actionable insights. Your response MUST be a valid JSON array of objects with this structure:
        [
          {{
            "title": "Short title",
            "desc": "Detailed 2 sentence explanation of the finding",
            "type": "opportunity, observation, recommendation, or alert",
            "confidence": 80 to 99
          }}
        ]
        Do not wrap the JSON in markdown blocks. Return ONLY the raw JSON array.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        # Clean the response to parse JSON reliably safely
        raw_text = ""
        try:
            raw_text = response.text.replace('```json', '').replace('```', '').strip()
        except ValueError as ve:
            print("VALUE ERROR EXTRACTING TEXT. Response:", response)
            raise ValueError("Gemini returned invalid response. It may have been blocked by safety settings.")
            
        print("--- RAW LLM RESPONSE ---")
        print(raw_text)
        print("------------------------")
        
        import re
        match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(raw_text)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Insight Generation Error: {str(e)}")

@app.post("/api/chat")
def chat_with_data(chat: ChatMessage, token: str = Depends(verify_token)):
    dataset_id = chat.dataset_id
    if dataset_id not in datasets:
        return {"response": "Please upload and select a dataset first."}
    df = datasets[dataset_id]
    try:
        import os
        from dotenv import load_dotenv
        import google.generativeai as genai

        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return {"response": "Error: GEMINI_API_KEY environment variable is missing. Please provide it to enable the AI!"}

        client = genai.Client()
        
        schema_info = f"Dataset size: {len(df)} rows. Columns: {list(df.columns)}."
        summary_stats = df.describe(include='all').to_string()
        
        forecast_context = ""
        try:
            date_col = next((c for c in df.columns if 'date' in str(c).lower()), None)
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            value_col = next((c for c in numeric_cols if 'revenue' in c.lower() or 'sales' in c.lower() or 'total' in c.lower()), None)
            if not value_col and numeric_cols: value_col = numeric_cols[-1]
            if date_col and value_col:
                import pandas as pd
                import numpy as np
                from sklearn.linear_model import LinearRegression
                tdf = df.copy()
                tdf[date_col] = pd.to_datetime(tdf[date_col], errors='coerce')
                tdf = tdf.dropna(subset=[date_col, value_col])
                tdf[value_col] = pd.to_numeric(tdf[value_col], errors='coerce')
                agg_df = tdf.groupby(tdf[date_col].dt.date)[value_col].sum().reset_index().sort_values(by=date_col)
                agg_df[date_col] = pd.to_datetime(agg_df[date_col])
                if len(agg_df) >= 3:
                    from sklearn.ensemble import RandomForestRegressor
                    agg_df['trend'] = np.arange(len(agg_df))
                    agg_df['dow'] = agg_df[date_col].dt.dayofweek
                    agg_df['month'] = agg_df[date_col].dt.month
                    agg_df['is_weekend'] = agg_df['dow'].apply(lambda x: 1 if x >= 5 else 0)
                    
                    y = agg_df[value_col].values
                    trend_m = LinearRegression().fit(agg_df[['trend']].values, y)
                    residuals = y - trend_m.predict(agg_df[['trend']].values)
                    rf_m = RandomForestRegressor(n_estimators=100, random_state=42).fit(agg_df[['dow', 'month', 'is_weekend']].values, residuals)
                    
                    last_date = agg_df[date_col].iloc[-1]
                    fut_dts = pd.DataFrame({date_col: [last_date + pd.Timedelta(days=i) for i in range(1, 31)]})
                    fut_dts['trend'] = np.arange(len(agg_df), len(agg_df) + 30)
                    fut_dts['dow'] = fut_dts[date_col].dt.dayofweek
                    fut_dts['month'] = fut_dts[date_col].dt.month
                    fut_dts['is_weekend'] = fut_dts['dow'].apply(lambda x: 1 if x >= 5 else 0)
                    
                    nxt_30 = trend_m.predict(fut_dts[['trend']].values) + rf_m.predict(fut_dts[['dow', 'month', 'is_weekend']].values)
                    nxt_30 = np.maximum(nxt_30, 0)
                    forecast_context = f"\n\nFORECAST DATA (30 periods for {value_col}):\nHistorical Avg: {y.mean():.2f}\nForecast Next 30 Days: starts ~{nxt_30[0]:.2f}, ends ~{nxt_30[-1]:.2f}. Use this mathematical trend whenever user asks for future predictions, forecasts, or next year sales."
        except Exception:
            pass
            
        prompt = f"""
You are a decision expert AI. The user is asking about their dataset.

Context ({schema_info}):
Summary Stats:
{summary_stats[:2000]}{forecast_context}

User asked: {chat.message}

Analyze the request and provide your response strictly as a JSON object with the following schema:
{{
  "problem": "A brief summary of the problem or question the user is asking. If it's a simple informational question, state it simply.",
  "reasoning_steps": [
    "Step 1 of your chain of thought",
    "Step 2...",
    "Step 3..."
  ],
  "options": [
    {{
      "name": "Option 1",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"]
    }}
  ],
  "recommendation": "Your final, clear recommendation or answer.",
  "confidence_score": "A number between 0 and 100 representing your confidence in this answer based on the data provided."
}}

If the user's question is simple and doesn't require options, leave the 'options' array empty. Do NOT wrap the JSON in Markdown delimiters like ```json. Return ONLY the raw JSON string.
"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Rule-based validation and formatting
        try:
            raw_text = response.text.replace('```json', '').replace('```', '').strip()
            # Find the first { and last } to ensure we only parse the JSON object
            start_idx = raw_text.find('{')
            end_idx = raw_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                raw_text = raw_text[start_idx:end_idx+1]
            
            data = json.loads(raw_text)
            
            # Construct the Markdown response
            md_response = f"### 🎯 Problem Analysis\n{data.get('problem', 'Unable to determine problem.')}\n\n"
            
            reasoning = data.get('reasoning_steps', [])
            if reasoning:
                md_response += "### 🧠 Chain of Thought\n"
                for i, step in enumerate(reasoning):
                    md_response += f"{i+1}. {step}\n"
                md_response += "\n"
                
            options = data.get('options', [])
            if options:
                md_response += "### ⚖️ Options & Analysis\n"
                for opt in options:
                    md_response += f"**{opt.get('name', 'Option')}**\n"
                    pros = opt.get('pros', [])
                    if pros:
                        md_response += f"- **Pros:** {', '.join(pros)}\n"
                    cons = opt.get('cons', [])
                    if cons:
                        md_response += f"- **Cons:** {', '.join(cons)}\n"
                md_response += "\n"
                
            md_response += f"### 💡 Final Recommendation\n{data.get('recommendation', 'No distinct recommendation provided.')}\n\n"
            md_response += f"### ✅ Confidence Score: {data.get('confidence_score', 'N/A')}/100"
            
            return {"response": md_response}
        except json.JSONDecodeError:
            # Fallback if the LLM hallucinates or fails to output valid JSON
            return {"response": f"AI Expert Response (Raw):\n\n{response.text}"}
    except Exception as e:
        return {"response": f"AI Error: {str(e)}"}