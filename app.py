import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__)

# Cache for parsed release notes to minimize external requests
cache = {
    "data": None,
    "last_fetched": None
}

def parse_entry_content(content_html, date, entry_link):
    """
    Parses the entry HTML content and splits it by <h3> headers to extract
    individual updates.
    """
    if not content_html:
        return []

    # re.split will separate content by <h3>...</h3> tags
    # The result is a list alternating between non-h3 elements and h3 group matches
    parts = re.split(r'<h3>(.*?)</h3>', content_html)
    updates = []
    
    # If no <h3> tags were found, return the entire content as a general update
    if len(parts) <= 1:
        if content_html.strip():
            # Generate ID
            date_safe = re.sub(r'[^a-zA-Z0-9]', '_', date)
            update_id = f"{date_safe}_General_0"
            updates.append({
                "id": update_id,
                "type": "General",
                "html": content_html.strip(),
                "date": date,
                "link": entry_link
            })
        return updates
        
    # parts[0] is everything before the first <h3> (usually whitespace)
    # parts[1] is first heading, parts[2] is first heading content, etc.
    for i in range(1, len(parts), 2):
        u_type = parts[i].strip()
        u_html = parts[i+1].strip() if i+1 < len(parts) else ""
        
        # Safe string for ID generation
        date_safe = re.sub(r'[^a-zA-Z0-9]', '_', date)
        type_safe = re.sub(r'[^a-zA-Z0-9]', '_', u_type)
        update_id = f"{date_safe}_{type_safe}_{i//2}"
        
        updates.append({
            "id": update_id,
            "type": u_type,
            "html": u_html,
            "date": date,
            "link": entry_link
        })
    return updates

def fetch_release_notes():
    """
    Fetches the Atom feed and parses it into structured updates.
    """
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityClient/1.0'}
    )
    
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    all_updates = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        date_str = title.text if title is not None else 'Unknown Date'
        
        link = entry.find('atom:link[@rel="alternate"]', ns)
        if link is None:
            link = entry.find('atom:link', ns)
        link_href = link.attrib.get('href', '') if link is not None else ''
        
        content = entry.find('atom:content', ns)
        content_html = content.text if content is not None else ''
        
        # Parse individual updates inside this entry
        entry_updates = parse_entry_content(content_html, date_str, link_href)
        all_updates.extend(entry_updates)
        
    return all_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch fresh data
        updates = fetch_release_notes()
        return jsonify({
            "success": True,
            "updates": updates,
            "count": len(updates)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Flask default runs on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
