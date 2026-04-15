import "@testing-library/jest-dom";

const replaceMock = jest.fn();
const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({
		replace: replaceMock,
		push: pushMock,
		refresh: refreshMock,
		prefetch: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
	}),
}));
