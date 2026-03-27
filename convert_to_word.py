import os
import re
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

def convert_markdown_to_docx(input_md, output_docx):
    if not os.path.exists(input_md):
        print(f"Error: {input_md} not found.")
        return

    doc = Document()
    
    # Read Markdown content
    with open(input_md, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        
        # Handle Headings
        if line.startswith('# '):
            h = doc.add_heading(line[2:], level=0)
            h.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif line.startswith('## '):
            doc.add_heading(line[3:], level=1)
        elif line.startswith('### '):
            doc.add_heading(line[4:], level=2)
        elif line.startswith('#### '):
            doc.add_heading(line[5:], level=3)
            
        # Handle Horizontal Rules
        elif line == '---':
            doc.add_page_break()
            
        # Handle Lists
        elif line.startswith('* ') or line.startswith('- '):
            doc.add_paragraph(line[2:], style='List Bullet')
        elif re.match(r'^\d+\.', line):
            # Numeric lists
            content = re.sub(r'^\d+\.\s+', '', line)
            doc.add_paragraph(content, style='List Number')
            
        # Handle Tables (Simpler representation)
        elif '|' in line:
            if '---' in line: continue # Skip separator lines
            cells = [c.strip() for c in line.split('|') if c.strip()]
            if not cells: continue
            
            # For simplicity in this script, we'll just add it as a tabbed paragraph
            # A full table conversion is complex, but this keeps the data readable
            doc.add_paragraph("\t".join(cells))
            
        # Handle Bold/Italic (Simple regex)
        elif line:
            # Clean Bold markers for the paragraph
            clean_line = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
            p = doc.add_paragraph(clean_line)
            
            # If it was a sub-header style (No leading # but all caps or bold)
            if line.startswith('**') and line.endswith('**'):
                p.style = 'Heading 3'

    doc.save(output_docx)
    print(f"Successfully converted {input_md} to {output_docx}")

if __name__ == "__main__":
    # Paths for the artifacts directory (Adjust if needed)
    input_file = r"C:\Users\ayush\.gemini\antigravity\brain\73afa305-48cf-4fc8-bfce-c62c19b77149\Academic_Project_Report.md"
    output_file = r"n:\projects\project\sem6\pawX\PawDevX_Academic_Report.docx"
    
    convert_markdown_to_docx(input_file, output_file)
