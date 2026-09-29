from hindsight.memory import retain_memory, recall_memories

memory = """
Incident INC-002:
payments-api experienced repeated database connection timeouts.
The root cause was an incorrectly configured connection pool.
Increasing the connection pool size and restarting the affected service resolved the incident.
"""

def main():
    print("Retaining incident...")
    try:
        retain_memory(memory)
        print("Memory retained successfully.")
    except Exception as e:
        print(f"Retain failed (check HINDSIGHT_API_KEY): {e}")

    print("\nRecalling memory...")
    results = recall_memories(
        "payments-api database connection timeout connection pool"
    )

    print("\nRecall results:")
    for result in results:
        print(result)

if __name__ == "__main__":
    main()