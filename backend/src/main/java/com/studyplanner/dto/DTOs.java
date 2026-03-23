package com.studyplanner.dto;


import com.studyplanner.model.Task;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

public class DTOs {

    @Data
    public static class SubjectRequest {
        private String name;
        private String description;
        private String color;
    } 

    @Data
    public static class TaskRequest {
        private String title;
        private Long subjectId;
        private LocalDate dueDate;
        private Task.Priority priority;
        private String notes;
    }

    @Data
    public static class TaskResponse {
        private Long id;
        private String title;
        private String notes;
        private LocalDate dueDate;
        private Task.Priority priority;
        private boolean completed;
        private String completedAt;
        private String createdAt;
        private Long subjectId;
        private String subjectName;
        private String subjectColor;
    }

    @Data
    public static class SessionRequest {
        private Long subjectId;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String notes;
    }

    @Data
    public static class SessionResponse {
        private Long id;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String notes;
        private Long subjectId;
        private String subjectName;
        private String subjectColor;
    }

    @Data
    public static class StatsSummary {
        private long subjects;
        private long tasksDone;
        private long tasksPending;
        private int streak;
    }

    @Data
    public static class DailyActivity {
        private String date;
        private long count;
    }

    @Data
    public static class ApiError {
        private int status;
        private String message;
        private String timestamp;
        public ApiError(int status, String message) {
            this.status = status;
            this.message = message;
            this.timestamp = java.time.LocalDateTime.now().toString();
        }
    }
}


