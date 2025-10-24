# Consent Management API Documentation

## Endpoints

### For Patients

#### 1. Get Consent Requests
- **GET** `/api/consent-requests`
- **Description**: Fetches all pending consent requests for the authenticated patient
- **Authentication**: Required (Patient)
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "doctorName": "Dr. John Doe",
      "specialization": "Cardiology",
      "requestDate": "2025-10-23T10:00:00Z",
      "purpose": "Review cardiac health records",
      "status": "pending"
    }
  ]
  ```

#### 2. Get Active Consents
- **GET** `/api/active-consents`
- **Description**: Fetches all active consents for the authenticated patient
- **Authentication**: Required (Patient)
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "doctorName": "Dr. Jane Smith",
      "specialization": "Neurology",
      "grantedDate": "2025-09-23T10:00:00Z",
      "expiryDate": "2025-10-23T10:00:00Z"
    }
  ]
  ```

#### 3. Handle Consent Request
- **POST** `/api/consent-requests/:consentId/:action`
- **Description**: Approve or deny a consent request
- **Authentication**: Required (Patient)
- **Parameters**:
  - consentId: UUID of the consent request
  - action: Either 'approve' or 'deny'
- **Response**:
  ```json
  {
    "message": "Consent request approved/denied"
  }
  ```

#### 4. Revoke Consent
- **POST** `/api/consents/:consentId/revoke`
- **Description**: Revoke an active consent
- **Authentication**: Required (Patient)
- **Parameters**:
  - consentId: UUID of the active consent
- **Response**:
  ```json
  {
    "message": "Consent revoked successfully"
  }
  ```

### For Doctors

#### 1. Create Consent Request
- **POST** `/api/consent-requests`
- **Description**: Create a new consent request for a patient
- **Authentication**: Required (Doctor)
- **Request Body**:
  ```json
  {
    "patientId": "uuid",
    "purpose": "Detailed purpose of the access request"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Consent request created successfully",
    "consentId": "uuid"
  }
  ```

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**
  ```json
  {
    "message": "Invalid request parameters"
  }
  ```

- **401 Unauthorized**
  ```json
  {
    "message": "Authentication required"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "message": "Insufficient permissions"
  }
  ```

- **404 Not Found**
  ```json
  {
    "message": "Resource not found"
  }
  ```

- **500 Internal Server Error**
  ```json
  {
    "message": "Internal server error"
  }
  ```

## Usage Notes

1. All dates are in ISO 8601 format
2. Authentication requires a valid JWT token in the Authorization header
3. Consent requests expire after 30 days if not acted upon
4. Active consents are valid for 30 days from approval
5. Revoked consents cannot be reactivated (require new request)