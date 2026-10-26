package lk.careflow.repository.lab;

import lk.careflow.entity.lab.LabCategory;
import lk.careflow.entity.lab.LabTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {

    Optional<LabTest> findByTestCode(String testCode);

    boolean existsByTestCode(String testCode);

    List<LabTest> findByIsActiveTrueOrderByTestNameAsc();

    @Query("SELECT lt FROM LabTest lt WHERE " +
           "(:category IS NULL OR lt.category = :category) AND " +
           "(:isActive IS NULL OR lt.isActive = :isActive) AND " +
           "(:query IS NULL OR (" +
           "LOWER(lt.testCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(lt.testName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(lt.description) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<LabTest> searchTests(
            @Param("query") String query,
            @Param("category") LabCategory category,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
