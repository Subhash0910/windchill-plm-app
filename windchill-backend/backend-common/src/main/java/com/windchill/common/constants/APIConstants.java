package com.windchill.common.constants;

public class APIConstants {
    public static final String API_V1 = "/api/v1";
    public static final String API_USERS = API_V1 + "/users";
    public static final String API_PRODUCTS = API_V1 + "/products";
    public static final String API_DOCUMENTS = API_V1 + "/documents";
    public static final String API_PROJECTS = API_V1 + "/projects";
    public static final String API_AUTH = API_V1 + "/auth";
    public static final String API_WORKFLOW = API_V1 + "/workflow";

    // JWT
    public static final String BEARER = "Bearer ";
    public static final String AUTHORIZATION = "Authorization";

    // Response messages
    public static final String SUCCESS = "Success";
    public static final String CREATED = "Created successfully";
    public static final String UPDATED = "Updated successfully";
    public static final String DELETED = "Deleted successfully";
    public static final String NOT_FOUND = "Resource not found";
    public static final String INVALID_REQUEST = "Invalid request";
}
