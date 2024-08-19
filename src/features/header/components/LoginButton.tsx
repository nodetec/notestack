import { signIn } from "~/auth";
import { Button } from "~/components/ui/button";

export function LoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <Button
        className="hidden focus-visible:outline-none focus-visible:ring-transparent lg:flex"
        variant="outline"
        type="submit"
      >
        <span className="text-[1.05rem]">Login &rarr;</span>
      </Button>
    </form>
  );
}
