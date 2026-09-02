from fpdf import FPDF
import os

docs = {
    "Document_No_Tasks.pdf": """Status Update
Progress is good. The system is stable.
Risks: The budget might run out before Q3.
Decisions: We decided to cancel the summer party.""",
    
    "Document_No_Risks.pdf": """Update 2
Tasks: Alice must finish the design by 10 October 2026.
Decisions: We agreed on the blue theme.""",
    
    "Document_No_Decisions.pdf": """Security Audit
Tasks: Bob to fix firewall holes by 12 Nov 2026.
Risks: If holes are not fixed, data breach is imminent.""",
    
    "Document_Long.pdf": """Annual Review 2025
""" + "Things are going well. " * 50 + """
However, we have issues.
Tasks:
- Management needs to review performance by 1 Jan 2027.
- Finance team must submit tax reports by 15 Feb 2027.
- Engineering strictly must migrate to Cloud by 5 March 2027.
Risks:
- Migration delay could cost $50k.
Decisions:
- We chose AWS over GCP.""",

    "Document_Conflicting.pdf": """Initial thoughts
Actually, nevermind.
Section A states: The deadline is 1st Jan.
Section B clarifies: The deadline was moved to 5th Jan.
Tasks:
- Charlie must finish coding by 5th Jan.
Risks: Conflicting timelines might confuse stakeholders.
Decisions: The team decided to adopt 5th Jan as final.""",
    
    "Document_Pending_Mixed.pdf": """Strategy Meeting
Tasks: Dan will organize the next meeting on Monday.
Decisions: The team decided to use React. Management must decide whether to hire more devs.
Risks: Lack of devs could delay project.""",

    "Document_Irrelevant.pdf": """Lobby Update
The lobby smells like pineapples today. Someone left a pizza on the desk.
Tasks: Janitor must clean the lobby by 10 AM tomorrow.
Risks: Ants may invade the office due to pizza.
Decisions: HR decided to ban pineapples in the office."""
}

for name, content in docs.items():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    # Using multi_cell to handle line breaks
    pdf.multi_cell(0, 10, txt=content)
    pdf.output(f"../backend/{name}")
    print(f"Generated {name}")
