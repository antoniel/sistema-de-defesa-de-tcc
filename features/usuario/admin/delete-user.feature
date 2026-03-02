# language: pt
@domain @usuario @admin @web

Feature: Admin Delete User
  As an administrator
  I want to delete users from the system
  So that I can manage the user base and remove accounts that are no longer needed

  Background:
    Given an admin user is authenticated
    And the admin is on the user management screen

  @id:USR-001
  Scenario: Admin successfully deletes a user
    Given a user exists with email "student@example.com"
    And the user has no references in bancas or other entities
    When the admin confirms deletion of that user
    Then the user is removed from the system
    And the user list is refreshed
    And a success feedback is shown

  @id:USR-002
  Scenario: Admin deletes user with associations via cascade after confirming alert
    Given a user exists with email "teacher@example.com"
    And the user is referenced in bancas or other entities
    When the admin initiates deletion of that user
    Then an alert is shown describing the cascade effects
    And the alert lists what will be removed or affected
    When the admin confirms the cascade deletion
    Then the user is removed from the system
    And associated records are removed or updated accordingly
    And the user list is refreshed
    And a success feedback is shown

  @id:USR-002a
  Scenario: Admin cancels cascade deletion after seeing alert
    Given a user exists with email "teacher@example.com"
    And the user is referenced in at least one banca
    When the admin initiates deletion of that user
    Then an alert is shown describing the cascade effects
    When the admin cancels the deletion
    Then the user remains in the system
    And no associated records are modified

  @id:USR-003
  Scenario: Delete fails when user not found
    Given no user exists with id 99999
    When the admin attempts to delete user with id 99999
    Then the deletion is rejected
    And a not found error is returned
    And no user is removed

  @id:USR-004
  Scenario: Non-admin cannot delete users
    Given a non-admin user is authenticated
    When the non-admin attempts to delete any user
    Then the request is rejected with unauthorized
    And no user is removed from the system
