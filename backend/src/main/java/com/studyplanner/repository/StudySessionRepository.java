package com.studyplanner.repository;

import com.studyplanner.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findBySubjectId(Long subjectId);

    @Query("SELECT COUNT(s) FROM StudySession s WHERE s.date = :date")
    long countByDate(@Param("date") LocalDate date);
}