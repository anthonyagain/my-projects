from datetime import datetime
import sys, os
from contextlib import contextmanager

@contextmanager
def timer(start_text="start", end_text="done {}"):
    """
    Utility function for timing blocks of code. Example usage:

    with timer():
        [code here]
    """
    start = datetime.now()
    print(start_text)
    yield
    end = datetime.now()
    print(end_text.format(str(end - start)))

def get_valid_input(valid_inputs):
    """
    Utility function for getting validated input from the user.
    """
    lowercase_valid_inputs = [valid_input.lower() for valid_input in valid_inputs]

    options_list = '/'.join(valid_inputs)
    user_input = input("{}: ".format(options_list)).lower()

    while user_input not in lowercase_valid_inputs:
        print("Invalid input, try again.")
        user_input = input("{}: ".format(options_list)).lower()

    return user_input

@contextmanager
def suppress_stdout():
    """
    Utility function for silencing all output to the console.
    """
    with open(os.devnull, "w") as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        yield
        sys.stdout = old_stdout
