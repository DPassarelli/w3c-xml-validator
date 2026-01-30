Feature: Appropriate handling of missing or invalid input data

  Scenario: Reject if there is no data
    Given an empty value
    When the exported function is called
    Then it should throw an error stating
    ```
    The function exported by `w3c-xml-validator` expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.
    ```

  Scenario: Reject if the data is not markup at all
    Given a value that is not markup
    When the exported function is called
    Then it should throw an error stating
    ```
    The function exported by `w3c-xml-validator` expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.
    ```

  Scenario: Reject if the data is markup, but does not include the XML declaration
    Given a value that does not start with the expected XML declaration
    When the exported function is called
    Then it should throw an error stating
    ```
    The function exported by `w3c-xml-validator` expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.
    ```

  Scenario: Reject if the data is markup, but does not include the XML declaration
    Given a value that is valid XML, and contains a DTD reference, but is not publicly accessible
    When the exported function is called
    Then it should throw an error stating
    ```
    The function exported by `w3c-xml-validator` expects to called with valid markup, including an XML declaration that is publicly accessible. Missing or invalid data provided.
    ```

  Scenario: Reject if the data is valid, but the remote server is unreachable
    Given a value that is valid XML
    And the remote server is unreachable
    When the exported function is called
    Then it should throw an error stating
    ```
    The W3C validation service cannot be reached (%%reason%%).
    ```
