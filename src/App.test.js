import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app navigation links", () => {
  render(<App />);

  expect(screen.getByRole("link", { name: /removetag/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /tagtype/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /pose/i })).toBeInTheDocument();
});
