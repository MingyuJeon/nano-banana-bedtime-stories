import React, { ChangeEvent, useEffect, useState } from "react";
import { useStoryStore } from "../store/useStoryStore";

const UserInfo: React.FC = () => {
  const { userInfo, setUserInfo } = useStoryStore();
  const [age, setAge] = useState<string>(userInfo?.age?.toString() || "");
  const [name, setName] = useState<string>(userInfo?.userName || "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">(
    userInfo?.gender || ""
  );
  const [error, setError] = useState<string>("");

  // Auto-save to store when valid input is provided
  useEffect(() => {
    if (age && gender) {
      const ageNum = parseInt(age, 10);
      if (ageNum >= 1 && ageNum <= 100) {
        setUserInfo({
          age: ageNum,
          gender: gender as "male" | "female" | "other",
          userName: name,
        });
        setError("");
      }
    }
  }, [age, gender, name, setUserInfo]);

  const handleAgeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setAge(value);
      if (value) {
        const ageNum = parseInt(value, 10);
        if (ageNum < 1 || ageNum > 100) {
          setError("나이는 1세에서 100세 사이여야 합니다");
        } else {
          setError("");
        }
      }
    }
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value as "male" | "female" | "other");
    setError("");
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <div className="user-info-container">
      <h2>독자 정보</h2>
      <div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="이름을 입력하세요"
            aria-label="이름"
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">나이</label>
          <input
            id="age"
            type="text"
            value={age}
            onChange={handleAgeChange}
            placeholder="나이를 입력하세요"
            aria-label="나이"
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">성별</label>
          <select
            id="gender"
            value={gender}
            onChange={handleGenderChange}
            aria-label="성별"
          >
            <option value="">선택하세요</option>
            <option value="male">남자</option>
            <option value="female">여자</option>
            <option value="other">기타</option>
          </select>
        </div>

        {error && (
          <div
            className="error-message"
            style={{ color: "red", marginTop: "10px" }}
          >
            {error}
          </div>
        )}

        {userInfo && (
          <div style={{ color: "green", marginTop: "10px" }}>
            ✓ 정보가 저장되었습니다
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
