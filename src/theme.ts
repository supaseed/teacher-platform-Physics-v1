import {
  Button,
  Card,
  Checkbox,
  NumberInput,
  Paper,
  Radio,
  SegmentedControl,
  TextInput,
  Textarea,
  Badge,
  Alert,
  Modal,
  createTheme,
} from "@mantine/core";

const sharp = { radius: 0 as const };

export const theme = createTheme({
  primaryColor: "accent",
  defaultRadius: 0,
  fontFamily:
    '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  headings: {
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: "700",
  },
  colors: {
    accent: [
      "#e6eeff",
      "#b3ccff",
      "#80aaff",
      "#4d88ff",
      "#0052FF",
      "#0047e0",
      "#003cc2",
      "#0031a3",
      "#002685",
      "#001b66",
    ],
  },
  white: "#F8F9FA",
  black: "#0F111A",
  components: {
    Button: Button.extend({ defaultProps: sharp }),
    Card: Card.extend({ defaultProps: sharp }),
    Checkbox: Checkbox.extend({ defaultProps: sharp }),
    Paper: Paper.extend({ defaultProps: sharp }),
    Badge: Badge.extend({ defaultProps: sharp }),
    Alert: Alert.extend({ defaultProps: sharp }),
    Modal: Modal.extend({ defaultProps: sharp }),
    NumberInput: NumberInput.extend({ defaultProps: sharp }),
    TextInput: TextInput.extend({ defaultProps: sharp }),
    Textarea: Textarea.extend({ defaultProps: sharp }),
    Radio: Radio.extend({ defaultProps: sharp }),
    SegmentedControl: SegmentedControl.extend({ defaultProps: sharp }),
  },
});
