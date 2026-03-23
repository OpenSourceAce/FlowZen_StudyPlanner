package com.studyplanner.study_planner_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StudyPlannerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudyPlannerBackendApplication.class, args);
		System.out.println("\n✅ StudyFlow API started at http://localhost:8080/api");
	}

}
