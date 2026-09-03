"""
Prompt Builder — Assembles the final AI prompt from all context sources.

This module builds the prompt that is sent to the AI provider.
It combines:
- System instructions
- EngineerOS rules
- All context sources (Experiment, Simulation, Quiz, Report, User, Conversation)
- Current user question

Key principles:
- Context is assembled in a consistent, structured format
- Authoritative data (especially simulation) is preserved exactly
- Missing data is not fabricated
- System instructions are separated from user input
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field

from app.services.ai.context_engine import ContextResult
from app.services.ai.types import AIMessage


@dataclass
class PromptTemplate:
    """Structured prompt template with all sections."""
    system_instructions: str = ""
    engineeros_rules: str = ""
    experiment_context: str = ""
    simulation_context: str = ""
    quiz_context: str = ""
    report_context: str = ""
    user_context: str = ""
    conversation_context: str = ""
    current_question: str = ""

    def build(self) -> str:
        """
        Build the final prompt from all sections.

        Returns:
            str: Complete prompt ready for the AI provider
        """
        sections = []

        # 1. System instructions (always included)
        if self.system_instructions:
            sections.append(self.system_instructions)

        # 2. EngineerOS rules (always included)
        if self.engineeros_rules:
            sections.append(self.engineeros_rules)

        # 3. Context sections (only if they have content)
        context_sections = [
            ("EXPERIMENT CONTEXT", self.experiment_context),
            ("SIMULATION CONTEXT", self.simulation_context),
            ("QUIZ CONTEXT", self.quiz_context),
            ("REPORT CONTEXT", self.report_context),
            ("USER CONTEXT", self.user_context),
            ("CONVERSATION CONTEXT", self.conversation_context),
        ]

        for header, content in context_sections:
            if content:
                sections.append(f"\n--- {header} ---\n{content}")

        # 4. Current question (always included)
        if self.current_question:
            sections.append(f"\n--- CURRENT USER QUESTION ---\n{self.current_question}")

        return "\n".join(sections)

    def to_messages(self) -> List[AIMessage]:
        """
        Convert the prompt to a list of AI messages.

        This is used for the provider's chat completion API.

        Returns:
            List[AIMessage]: List of messages for the provider
        """
        prompt = self.build()
        return [AIMessage(role="system", content=prompt)]


class PromptBuilder:
    """
    Builds the final AI prompt from context and user input.

    This class is responsible for assembling all context sources into
    a structured, deterministic prompt for the AI provider.
    """

    # System instructions (can be extended based on product requirements)
    SYSTEM_INSTRUCTIONS = """You are EngineerOS Mentor, an AI teaching assistant for electrical engineering.

Your role is to help students understand engineering concepts, solve problems, and think critically.

Guidelines:
- Be clear, concise, and educational
- Use authoritative application data provided in the context
- Explain engineering reasoning rather than only giving answers
- Be supportive and encouraging
- Adapt explanations to the student's level when possible"""

    # EngineerOS grounding rules
    ENGINEEROS_RULES = """GROUNDING RULES - YOU MUST FOLLOW THESE:

1. Use ONLY the application data provided in the context sections below.
2. NEVER fabricate measurements, simulation results, quiz scores, reports, or user progress.
3. NEVER override deterministic application results.
4. Distinguish between theoretical concepts, simulated values, and measured values.
5. If required data is missing, clearly say that it is missing.
6. Do not claim to have performed a simulation unless EngineerOS actually performed it.
7. When explaining simulation results, use the exact values provided in the simulation context.
8. Do not calculate or infer values that are not explicitly provided.
9. Keep explanations educational and grounded in engineering principles.
10. If a student asks for a direct answer that would bypass learning, provide a helpful hint instead."""

    def __init__(self):
        self.template = PromptTemplate()

    def build_prompt(self, context: ContextResult, question: str) -> str:
        """
        Build the final prompt from context and user question.

        Args:
            context: Structured context from the ContextEngine
            question: The user's current question

        Returns:
            str: Complete prompt ready for the AI provider
        """
        template = PromptTemplate()

        # 1. System instructions
        template.system_instructions = self.SYSTEM_INSTRUCTIONS

        # 2. EngineerOS rules
        template.engineeros_rules = self.ENGINEEROS_RULES

        # 3. Experiment context
        if context.experiment:
            template.experiment_context = self._format_experiment(context.experiment)

        # 4. Simulation context
        if context.simulation:
            template.simulation_context = self._format_simulation(context.simulation)

        # 5. Quiz context
        if context.quiz:
            template.quiz_context = self._format_quiz(context.quiz)

        # 6. Report context
        if context.report:
            template.report_context = self._format_report(context.report)

        # 7. User context
        if context.user:
            template.user_context = self._format_user(context.user)

        # 8. Conversation context
        if context.conversation:
            template.conversation_context = self._format_conversation(context.conversation)

        # 9. Current question
        template.current_question = question

        return template.build()

    def build_messages(self, context: ContextResult, question: str) -> List[AIMessage]:
        """
        Build messages for the AI provider.

        Args:
            context: Structured context from the ContextEngine
            question: The user's current question

        Returns:
            List[AIMessage]: Messages for the provider
        """
        prompt = self.build_prompt(context, question)
        return [AIMessage(role="system", content=prompt)]

    def _format_experiment(self, experiment: Dict[str, Any]) -> str:
        """Format experiment context."""
        lines = []
        lines.append(f"Experiment: {experiment.get('title', 'Unknown')}")
        if experiment.get('difficulty'):
            lines.append(f"Difficulty: {experiment.get('difficulty')}")
        if experiment.get('category'):
            lines.append(f"Category: {experiment.get('category')}")
        if experiment.get('objective'):
            lines.append(f"Objective: {experiment.get('objective')}")
        if experiment.get('theory'):
            lines.append(f"Theory: {experiment.get('theory')}")
        if experiment.get('short_description'):
            lines.append(f"Description: {experiment.get('short_description')}")
        return "\n".join(lines)

    def _format_simulation(self, simulation: Dict[str, Any]) -> str:
        """Format simulation context."""
        lines = []

        # Status
        lines.append(f"Status: {simulation.get('status', 'unknown')}")

        # Validation
        if simulation.get('validation'):
            validation = simulation['validation']
            if validation.get('valid'):
                lines.append("Validation: PASSED")
            else:
                lines.append("Validation: FAILED")
                if validation.get('errors'):
                    lines.append("Errors:")
                    for error in validation['errors']:
                        lines.append(f"  - {error.get('code')}: {error.get('message')}")
                        if error.get('explanation'):
                            lines.append(f"    Explanation: {error.get('explanation')}")
                        if error.get('suggested_fix'):
                            lines.append(f"    Suggested Fix: {error.get('suggested_fix')}")
                if validation.get('warnings'):
                    lines.append("Warnings:")
                    for warning in validation['warnings']:
                        lines.append(f"  - {warning.get('message')}")

        # DC results
        if simulation.get('dc_result'):
            dc = simulation['dc_result']
            if dc.get('success'):
                lines.append(f"Total Current: {dc.get('total_current', 'N/A')} A")
                lines.append(f"Total Power: {dc.get('total_power', 'N/A')} W")
                lines.append(f"Equivalent Resistance: {dc.get('equivalent_resistance', 'N/A')} Ω")
                if dc.get('component_results'):
                    lines.append("Component Results:")
                    for comp in dc['component_results']:
                        lines.append(
                            f"  - {comp.get('component_id')}: "
                            f"V={comp.get('voltage', 'N/A')}V, "
                            f"I={comp.get('current', 'N/A')}A, "
                            f"P={comp.get('power', 'N/A')}W"
                        )
            else:
                lines.append(f"DC Solver Failed: {dc.get('error', 'Unknown error')}")

        # Measurements
        if simulation.get('measurements'):
            meas = simulation['measurements']
            lines.append(f"Total Voltage: {meas.get('total_voltage', 'N/A')} V")
            lines.append(f"Total Current: {meas.get('total_current', 'N/A')} A")
            lines.append(f"Total Power: {meas.get('total_power', 'N/A')} W")
            if meas.get('component_measurements'):
                lines.append("Component Measurements:")
                for cm in meas['component_measurements']:
                    lines.append(
                        f"  - {cm.get('component_id')}: "
                        f"V={cm.get('voltage', 'N/A')}V, "
                        f"I={cm.get('current', 'N/A')}A, "
                        f"P={cm.get('power', 'N/A')}W"
                    )

        # Graph summaries
        if simulation.get('graphs'):
            lines.append("Graphs Available:")
            for graph in simulation['graphs']:
                lines.append(f"  - {graph.get('title')} ({graph.get('type')})")

        return "\n".join(lines)

    def _format_quiz(self, quiz: Dict[str, Any]) -> str:
        """Format quiz context."""
        lines = []
        lines.append(f"Quiz for: {quiz.get('experiment_id', 'Unknown')}")

        if quiz.get('total_questions'):
            lines.append(f"Total Questions: {quiz.get('total_questions')}")

        if quiz.get('questions'):
            lines.append("Questions:")
            for i, q in enumerate(quiz['questions'], 1):
                lines.append(f"  Q{i}: {q.get('question', 'N/A')}")
                if q.get('options'):
                    opts = q['options']
                    if len(opts) >= 4:
                        lines.append(f"    A: {opts[0]}")
                        lines.append(f"    B: {opts[1]}")
                        lines.append(f"    C: {opts[2]}")
                        lines.append(f"    D: {opts[3]}")

        if quiz.get('student_answer'):
            lines.append(f"Student Answer: {quiz.get('student_answer')}")

        if quiz.get('is_correct') is not None:
            lines.append(f"Correct: {quiz.get('is_correct')}")

        if quiz.get('official_result'):
            result = quiz['official_result']
            lines.append(f"Score: {result.get('score', 'N/A')}")

        return "\n".join(lines)

    def _format_report(self, report: Dict[str, Any]) -> str:
        """Format report context."""
        lines = []
        lines.append(f"Report: {report.get('title', 'Unknown')}")
        lines.append(f"Status: {report.get('status', 'unknown')}")

        if report.get('observations'):
            lines.append(f"Observations: {report.get('observations')}")

        if report.get('conclusion'):
            lines.append(f"Conclusion: {report.get('conclusion')}")

        return "\n".join(lines)

    def _format_user(self, user: Dict[str, Any]) -> str:
        """Format user context."""
        lines = []
        lines.append(f"Completed Experiments: {user.get('completed_experiments', 0)}")

        if user.get('preferred_difficulty'):
            lines.append(f"Preferred Difficulty: {user.get('preferred_difficulty')}")

        if user.get('current_experiment'):
            exp = user['current_experiment']
            lines.append(f"Current Experiment: {exp.get('title', 'Unknown')}")

        if user.get('recent_learning'):
            lines.append("Recent Learning:")
            for item in user['recent_learning'][:5]:
                lines.append(f"  - Experiment {item.get('experiment_id')}: {item.get('status')}")

        if user.get('completed_experiments_list'):
            lines.append("Completed Experiments:")
            for exp in user['completed_experiments_list'][:5]:
                lines.append(f"  - {exp.get('title')} ({exp.get('difficulty', 'N/A')})")

        return "\n".join(lines)

    def _format_conversation(self, conversation: List[Dict[str, Any]]) -> str:
        """Format conversation context."""
        if not conversation:
            return "No conversation history"

        lines = []
        lines.append("Recent Conversation:")
        for msg in conversation[-10:]:  # Limit to last 10 messages
            role = "User" if msg.get('role') == 'user' else "Assistant"
            content = msg.get('content', '')
            # Truncate long messages
            if len(content) > 200:
                content = content[:200] + "..."
            lines.append(f"  {role}: {content}")

        return "\n".join(lines)