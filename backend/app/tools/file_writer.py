import os

class FileWriterTool:
    """
    Corresponds to FileWriteTool from Section 5.6 of the thesis.
    Saves generated code and test artifacts to output directory.
    """

    @classmethod
    def save_artifact(cls, story_id: str, code: str, tests: str, ext: str = "py") -> str:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "output", "stories"))
        os.makedirs(base_dir, exist_ok=True)

        code_file = os.path.join(base_dir, f"{story_id}_impl.{ext}")
        with open(code_file, "w", encoding="utf-8") as f:
            f.write(code)

        test_file = os.path.join(base_dir, f"{story_id}_test.{ext}")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(tests)

        return base_dir
