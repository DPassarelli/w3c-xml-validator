Feature: Appropriate handling of missing or invalid input data

  Scenario: Reject if there is no data
    Given an empty input
    When the exported function is called
    Then it should throw an error stating
    ```
    The function exported by `w3c-xml-validator` expects to called with valid markup. Missing or invalid data provided.
    ```
