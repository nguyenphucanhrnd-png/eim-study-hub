import { ButtonLink, PageHeader } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Không tìm thấy trang" subtitle="Đường dẫn không tồn tại hoặc đã thay đổi." />
      <ButtonLink to="/">Về trang tổng quan</ButtonLink>
    </>
  );
}
