# language: pt
@domain @usuario @admin @web

Feature: Admin View User Detail
  As an administrator
  I want to view all data related to a user in a dedicated screen
  So that I can inspect their profile, roles, and participation in bancas before taking actions

  Background:
    Given an admin user is authenticated
    And the admin is on the user management screen

  @id:USR-005
  Scenario: Admin navigates to user detail by selecting a user row
    Given a user exists with email "teacher@example.com"
    And the user appears in the user list
    When the admin selects that user from the list
    Then the admin is taken to the user detail screen
    And the user profile information is displayed
    And the screen shows the user name, email, matricula, role, school, and academic title

  @id:USR-006
  Scenario: Admin sees user associations on detail screen
    Given a user exists with email "teacher@example.com"
    And the user is orientador in at least one banca
    And the user is membro in at least one other banca
    When the admin selects that user from the list
    Then the user detail screen displays bancas where the user is orientador
    And the user detail screen displays bancas where the user is membro
    And each banca shows its title and author or role

  @id:USR-007
  Scenario: Admin sees empty associations when user has none
    Given a user exists with email "newuser@example.com"
    And the user has no references in bancas or other entities
    When the admin selects that user from the list
    Then the user detail screen displays the user profile
    And the associations section indicates no bancas or participations

  @id:USR-008
  Scenario: Admin can return from user detail to user list
    Given the admin is viewing the detail of a user
    When the admin navigates back to the user management screen
    Then the user list is displayed
    And the previous filter or tab state is preserved when applicable

  @id:USR-009
  Scenario: Non-admin cannot access user detail
    Given a non-admin user is authenticated
    When the non-admin attempts to view detail of any user
    Then the request is rejected with unauthorized
    Or the non-admin is redirected away from the user detail screen
