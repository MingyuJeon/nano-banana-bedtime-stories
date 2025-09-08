import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { useStoryStore } from "../../store/useStoryStore";

const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    rotateX: -15
  },
  show: { 
    opacity: 1, 
    y: 0,
    rotateX: 0,
    transition: { 
      duration: 0.9,
      ease: [0.43, 0.13, 0.23, 0.96],
      delay: 0.1
    }
  },
};

function ReaderForm({ active }: { active: boolean }) {
  const { setUserInfo } = useStoryStore();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age && gender) {
      setUserInfo({
        age: parseInt(age, 10),
        gender: gender as "male" | "female" | "other",
        userName: name,
      });
    }
  };

  return (
    <motion.form
      initial="hidden"
      animate={active ? "show" : "hidden"}
      variants={fadeUp}
      className="form-card"
      onSubmit={handleSubmit}
    >
      <h2 className="form-title">About You</h2>
      
      <div className="form-group">
        <label className="form-label">
          Name
        </label>
        <input
          className="form-input"
          name="name"
          placeholder="e.g. Aiden"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">
          Age
        </label>
        <input
          className="form-input"
          type="number"
          name="age"
          min={1}
          max={120}
          placeholder="Your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">
          Gender
        </label>
        <select
          className="form-select"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
          required
        >
          <option value="" disabled>Select…</option>
          <option value="female">Girl</option>
          <option value="male">Boy</option>
          <option value="other">Non-binary</option>
        </select>
      </div>
      
      <button
        className="btn-gradient"
        type="submit"
      >
        Save
      </button>
    </motion.form>
  );
}

export default ReaderForm;