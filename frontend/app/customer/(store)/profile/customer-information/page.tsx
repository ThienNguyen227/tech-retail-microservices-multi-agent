"use client";

import { customerCustomerService } from "@/lib/axios/services/customer-services/customer_service";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  ShieldCheck,
  ChevronRight,
  House,
  Pencil,
  Check,
  X,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Hash,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Trash2,
  MapPinned,
  Star,
  StarOff,
  Save,
  User,
  VenusAndMars,
} from "lucide-react";

type CustomerAddress = {
  customer_address_id: string;
  customer_address_line: string;
  customer_address_ward: string | null;
  customer_address_province: string | null;
  customer_address_default: boolean;
};

type CustomerProfile = {
  customer_id: string;
  customer_user_id: string;
  customer_code: string;
  customer_full_name: string | null;
  customer_date_of_birth: string | null;
  customer_gender: string | null;
  customer_status: string;
  customer_created_at?: string;
  customer_updated_at?: string;
  addresses: CustomerAddress[];
};

type CustomerInformationPayload = {
  customer_full_name: string | null;
  customer_date_of_birth: string | null;
  customer_gender: string | null;
};

type AddressPayload = {
  customer_address_line: string;
  customer_address_ward: string | null;
  customer_address_province: string | null;
  customer_address_default: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Đang hoạt động",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        dot: "bg-emerald-500",
      };

    case "INACTIVE":
      return {
        label: "Không hoạt động",
        className: "bg-slate-100 text-slate-600 ring-slate-500/20",
        dot: "bg-slate-400",
      };

    case "LOCKED":
    case "BLOCKED":
      return {
        label: "Đã khóa",
        className: "bg-red-50 text-red-700 ring-red-600/20",
        dot: "bg-red-500",
      };

    default:
      return {
        label: status || "Chưa xác định",
        className: "bg-slate-100 text-slate-600 ring-slate-500/20",
        dot: "bg-slate-400",
      };
  }
}

function getGenderLabel(gender: string | null) {
  switch (gender) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    default:
      return "Chưa cập nhật";
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  const message = err.response?.data?.message;

  return Array.isArray(message)
    ? message.join("\n")
    : message || fallback;
}

function isUnauthorized(error: unknown) {
  const err = error as {
    response?: {
      status?: number;
    };
  };

  return err.response?.status === 401;
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:p-6 [&:nth-child(odd)]:sm:border-r [&:nth-last-child(-n+2)]:sm:border-b-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {value || "Chưa cập nhật"}
        </p>
      </div>
    </div>
  );
}

export default function CustomerInformationPage() {
  const router = useRouter();

  // Customer information
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit customer information
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [formName, setFormName] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formGender, setFormGender] = useState("");

  // Edit address
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressEditError, setAddressEditError] = useState("");

  const [formAddressLine, setFormAddressLine] = useState("");
  const [formAddressWard, setFormAddressWard] = useState("");
  const [formAddressProvince, setFormAddressProvince] = useState("");
  const [formAddressDefault, setFormAddressDefault] = useState(false);

  // Add address
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingNewAddress, setSavingNewAddress] = useState(false);
  const [addAddressError, setAddAddressError] = useState("");

  const [newAddressLine, setNewAddressLine] = useState("");
  const [newAddressWard, setNewAddressWard] = useState("");
  const [newAddressProvince, setNewAddressProvince] = useState("");
  const [newAddressDefault, setNewAddressDefault] = useState(false);

  // Delete address
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // ==========================================
  // 1. (GET) CUSTOMER-INFORMATION
  // ==========================================
  const loadCustomerInformation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await customerCustomerService.getCustomerInformation();

      const result = response?.data ?? response;

      // Hỗ trợ trường hợp BE trả về { data: customer }.
      const customer =
        result?.data && !Array.isArray(result.data)
          ? result.data
          : result;

      setProfile({
        ...customer,
        addresses: Array.isArray(customer?.addresses)
          ? customer.addresses
          : [],
      });
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        router.replace("/customer/login");
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Không thể tải thông tin khách hàng. Vui lòng thử lại.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCustomerInformation();
  }, [loadCustomerInformation]);

  // ==========================================
  // Edit customer information
  // ==========================================
  function startEditing() {
    if (!profile) return;

    setFormName(profile.customer_full_name ?? "");
    setFormDateOfBirth(
      profile.customer_date_of_birth
        ? profile.customer_date_of_birth.slice(0, 10)
        : "",
    );
    setFormGender(profile.customer_gender ?? "");

    setEditError("");
    setSuccessMessage("");
    setEditing(true);
  }

  function closeEditing() {
    if (saving) return;

    setEditing(false);
    setEditError("");
  }

  async function saveCustomerProfile() {
    if (!profile) return;

    const name = formName.trim();

    if (name.length > 100) {
      setEditError("Họ và tên không được vượt quá 100 ký tự.");
      return;
    }

    if (
      formDateOfBirth &&
      formDateOfBirth > new Date().toISOString().slice(0, 10)
    ) {
      setEditError("Ngày sinh không được lớn hơn ngày hiện tại.");
      return;
    }

    setSaving(true);
    setEditError("");
    setSuccessMessage("");

    // try {
    //   const payload: CustomerInformationPayload = {
    //     customer_full_name: name || null,
    //     customer_date_of_birth: formDateOfBirth || null,
    //     customer_gender: formGender || null,
    //   };

    //   // API: cập nhật thông tin khách hàng.
    //   const response =
    //     await customerUserService.updateCustomerInformation(
    //       profile.customer_user_id,
    //       payload,
    //     );

    //   const result = response?.data ?? response;
    //   const updatedCustomer =
    //     result?.data && !Array.isArray(result.data)
    //       ? result.data
    //       : result;

    //   setProfile((current) => {
    //     if (!current) return current;

    //     return {
    //       ...current,
    //       ...(updatedCustomer &&
    //       typeof updatedCustomer === "object"
    //         ? updatedCustomer
    //         : {}),
    //       customer_full_name:
    //         updatedCustomer?.customer_full_name ?? payload.customer_full_name,
    //       customer_date_of_birth:
    //         updatedCustomer?.customer_date_of_birth ??
    //         payload.customer_date_of_birth,
    //       customer_gender:
    //         updatedCustomer?.customer_gender ?? payload.customer_gender,
    //       addresses: current.addresses,
    //     };
    //   });

    //   setEditing(false);
    //   setSuccessMessage("Cập nhật thông tin khách hàng thành công!");
    // } catch (err: unknown) {
    //   if (isUnauthorized(err)) {
    //     localStorage.removeItem("accessToken");
    //     sessionStorage.removeItem("accessToken");
    //     router.replace("/customer/login");
    //     return;
    //   }

    //   setEditError(
    //     getErrorMessage(
    //       err,
    //       "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.",
    //     ),
    //   );
    // } finally {
    //   setSaving(false);
    // }
  }

  // ==========================================
  // Edit address
  // ==========================================
  function startEditingAddress(address: CustomerAddress) {
    setEditingAddress(address);
    setFormAddressLine(address.customer_address_line ?? "");
    setFormAddressWard(address.customer_address_ward ?? "");
    setFormAddressProvince(address.customer_address_province ?? "");
    setFormAddressDefault(address.customer_address_default);
    setAddressEditError("");
  }

  function closeAddressEditing() {
    if (savingAddress) return;

    setEditingAddress(null);
    setAddressEditError("");
  }

  async function saveAddress() {
    if (!editingAddress) return;

    if (!formAddressLine.trim()) {
      setAddressEditError("Vui lòng nhập địa chỉ.");
      return;
    }

    setSavingAddress(true);
    setAddressEditError("");
    setSuccessMessage("");

    // try {
    //   const payload: AddressPayload = {
    //     customer_address_line: formAddressLine.trim(),
    //     customer_address_ward: formAddressWard.trim() || null,
    //     customer_address_province: formAddressProvince.trim() || null,
    //     customer_address_default: formAddressDefault,
    //   };

    //   // API: cập nhật địa chỉ.
    //   await customerUserService.updateCustomerAddress(
    //     editingAddress.customer_address_id,
    //     payload,
    //   );

    //   setProfile((current) => {
    //     if (!current) return current;

    //     return {
    //       ...current,
    //       addresses: current.addresses.map((address) => {
    //         if (
    //           address.customer_address_id ===
    //           editingAddress.customer_address_id
    //         ) {
    //           return {
    //             ...address,
    //             ...payload,
    //           };
    //         }

    //         if (formAddressDefault) {
    //           return {
    //             ...address,
    //             customer_address_default: false,
    //           };
    //         }

    //         return address;
    //       }),
    //     };
    //   });

    //   setEditingAddress(null);
    //   setSuccessMessage("Cập nhật địa chỉ thành công!");
    // } catch (err: unknown) {
    //   if (isUnauthorized(err)) {
    //     localStorage.removeItem("accessToken");
    //     sessionStorage.removeItem("accessToken");
    //     router.replace("/customer/login");
    //     return;
    //   }

    //   setAddressEditError(
    //     getErrorMessage(err, "Không thể cập nhật địa chỉ."),
    //   );
    // } finally {
    //   setSavingAddress(false);
    // }
  }

  // ==========================================
  // Add address
  // ==========================================
  function startAddingAddress() {
    setNewAddressLine("");
    setNewAddressWard("");
    setNewAddressProvince("");
    setNewAddressDefault(
      !profile?.addresses.some(
        (address) => address.customer_address_default,
      ),
    );
    setAddAddressError("");
    setAddingAddress(true);
  }

  function closeAddingAddress() {
    if (savingNewAddress) return;

    setAddingAddress(false);
    setAddAddressError("");
  }

  async function saveNewAddress() {
    if (!profile) return;

    if (!newAddressLine.trim()) {
      setAddAddressError("Vui lòng nhập địa chỉ.");
      return;
    }

    setSavingNewAddress(true);
    setAddAddressError("");
    setSuccessMessage("");

    // try {
    //   const payload: AddressPayload = {
    //     customer_address_line: newAddressLine.trim(),
    //     customer_address_ward: newAddressWard.trim() || null,
    //     customer_address_province: newAddressProvince.trim() || null,
    //     customer_address_default: newAddressDefault,
    //   };

    //   // API: tạo địa chỉ mới.
    //   const response = await customerUserService.createCustomerAddress(
    //     profile.customer_id,
    //     payload,
    //   );

    //   const result = response?.data ?? response;
    //   const newAddress =
    //     result?.data && !Array.isArray(result.data)
    //       ? result.data
    //       : result;

    //   if (!newAddress?.customer_address_id) {
    //     // Nếu BE chưa trả object địa chỉ, tải lại danh sách từ server.
    //     setAddingAddress(false);
    //     await loadCustomerInformation();
    //     setSuccessMessage("Đã gửi yêu cầu thêm địa chỉ.");
    //     return;
    //   }

    //   setProfile((current) => {
    //     if (!current) return current;

    //     const addresses = newAddressDefault
    //       ? current.addresses.map((address) => ({
    //           ...address,
    //           customer_address_default: false,
    //         }))
    //       : [...current.addresses];

    //     return {
    //       ...current,
    //       addresses: [...addresses, newAddress],
    //     };
    //   });

    //   setAddingAddress(false);
    //   setSuccessMessage("Thêm địa chỉ thành công!");
    // } catch (err: unknown) {
    //   if (isUnauthorized(err)) {
    //     localStorage.removeItem("accessToken");
    //     sessionStorage.removeItem("accessToken");
    //     router.replace("/customer/login");
    //     return;
    //   }

    //   setAddAddressError(
    //     getErrorMessage(err, "Không thể thêm địa chỉ."),
    //   );
    // } finally {
    //   setSavingNewAddress(false);
    // }
  }

  // ==========================================
  // Delete address
  // ==========================================
  async function deleteAddress(address: CustomerAddress) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa địa chỉ "${address.customer_address_line}" không?`,
    );

    if (!confirmed) return;

    setDeletingAddressId(address.customer_address_id);
    setSuccessMessage("");

    // try {
    //   // API: xóa địa chỉ.
    //   await customerUserService.deleteCustomerAddress(
    //     address.customer_address_id,
    //   );

    //   setProfile((current) => {
    //     if (!current) return current;

    //     return {
    //       ...current,
    //       addresses: current.addresses.filter(
    //         (item) =>
    //           item.customer_address_id !==
    //           address.customer_address_id,
    //       ),
    //     };
    //   });

    //   setSuccessMessage("Xóa địa chỉ thành công!");
    // } catch (err: unknown) {
    //   if (isUnauthorized(err)) {
    //     localStorage.removeItem("accessToken");
    //     sessionStorage.removeItem("accessToken");
    //     router.replace("/customer/login");
    //     return;
    //   }

    //   window.alert(getErrorMessage(err, "Không thể xóa địa chỉ."));
    // } finally {
    //   setDeletingAddressId(null);
    // }
  }

  const status = profile ? getStatus(profile.customer_status) : null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-12">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 transition hover:text-teal-700"
          >
            <House size={16} />
            <span>Trang chủ</span>
          </Link>

          <ChevronRight size={15} className="text-slate-400" />

          <span className="font-semibold text-slate-800">
            Thông tin khách hàng
          </span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Thông tin khách hàng
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý hồ sơ cá nhân và địa chỉ nhận hàng của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Tài khoản của tôi
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                Trung tâm tài khoản
              </p>
            </div>

            <nav className="space-y-1 p-3">
              <Link
                href="/customer/profile/account-information"
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700"
              >
                <UserRound size={19} />
                <span>Thông tin tài khoản</span>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </Link>

              <Link
                href="/customer/profile/customer-information"
                className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3.5 text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-100"
              >
                <ShieldCheck size={19} />
                <span>Thông tin khách hàng</span>
                <ChevronRight size={16} className="ml-auto" />
              </Link>
            </nav>

            <div className="mx-4 border-t border-slate-100" />

            <div className="p-4">
              <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <MapPinned size={17} className="text-teal-600" />
                  <span className="text-sm font-semibold">
                    Địa chỉ nhận hàng
                  </span>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Cập nhật địa chỉ chính xác để thuận tiện cho việc giao hàng.
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="min-w-0 space-y-6">
            {/* Loading */}
            {loading && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <LoaderCircle
                  size={36}
                  className="animate-spin text-teal-600"
                />
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Đang tải thông tin khách hàng...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={22}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">
                      Không thể tải thông tin
                    </h2>

                    <p className="mt-1 whitespace-pre-line text-sm text-slate-500">
                      {error}
                    </p>

                    <button
                      type="button"
                      onClick={() => void loadCustomerInformation()}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      <RefreshCw size={16} />
                      Thử lại
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && profile && (
              <>
                {/* Customer banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-6 text-white shadow-lg shadow-teal-900/10 sm:p-8">
                  <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[32px] border-white/10" />
                  <div className="pointer-events-none absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/5" />

                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-inner backdrop-blur">
                      <UserRound size={38} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-teal-50">
                        Hồ sơ khách hàng
                      </p>

                      <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                        {profile.customer_full_name ||
                          "Chưa cập nhật họ và tên"}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status?.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status?.dot}`}
                          />
                          {status?.label}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90">
                          <Hash size={14} />
                          Mã khách hàng: {profile.customer_code}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-md"
                    >
                      <Pencil size={16} />
                      Chỉnh sửa
                    </button>
                  </div>
                </div>

                {/* Success message */}
                {successMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <Check size={18} className="mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Customer details */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Chi tiết khách hàng
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Thông tin cá nhân trong hồ sơ khách hàng của bạn.
                      </p>
                    </div>

                    <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      Hồ sơ cá nhân
                    </span>
                  </div>

                  <div className="grid gap-0 sm:grid-cols-2">
                    <InfoItem
                      icon={<Hash size={19} />}
                      label="Mã khách hàng"
                      value={profile.customer_code}
                    />

                    <InfoItem
                      icon={<User size={19} />}
                      label="Họ và tên khách hàng"
                      value={profile.customer_full_name || ""}
                    />

                    <InfoItem
                      icon={<CalendarDays size={19} />}
                      label="Ngày sinh"
                      value={formatDate(profile.customer_date_of_birth)}
                    />

                    <InfoItem
                      icon={<VenusAndMars size={19} />}
                      label="Giới tính"
                      value={getGenderLabel(profile.customer_gender)}
                    />

                    <InfoItem
                      icon={<ShieldCheck size={19} />}
                      label="Trạng thái"
                      value={status?.label || ""}
                    />

                    <InfoItem
                      icon={<Clock3 size={19} />}
                      label="Cập nhật lần cuối"
                      value={formatDate(profile.customer_updated_at)}
                    />
                  </div>
                </div>

                {/* Addresses */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Địa chỉ nhận hàng
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Quản lý các địa chỉ giao hàng của bạn.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={startAddingAddress}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      <Plus size={17} />
                      Thêm địa chỉ
                    </button>
                  </div>

                  <div className="p-5 sm:p-7">
                    {profile.addresses.length > 0 ? (
                      <div className="space-y-4">
                        {profile.addresses.map((address) => (
                          <div
                            key={address.customer_address_id}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-teal-200 hover:bg-teal-50/30"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                <MapPin size={22} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="break-words text-sm font-semibold leading-6 text-slate-800">
                                    {address.customer_address_line}
                                  </p>

                                  {address.customer_address_default && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/15">
                                      <Star size={12} />
                                      Mặc định
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {[
                                    address.customer_address_ward,
                                    address.customer_address_province,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "Chưa cập nhật khu vực"}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  Mã địa chỉ: {address.customer_address_id}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingAddress(address)}
                                  disabled={
                                    deletingAddressId ===
                                    address.customer_address_id
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
                                >
                                  <Pencil size={15} />
                                  Sửa
                                </button>

                                <button
                                  type="button"
                                  onClick={() => void deleteAddress(address)}
                                  disabled={
                                    deletingAddressId ===
                                    address.customer_address_id
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingAddressId ===
                                  address.customer_address_id ? (
                                    <LoaderCircle
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={15} />
                                  )}

                                  {deletingAddressId ===
                                  address.customer_address_id
                                    ? "Đang xóa"
                                    : "Xóa"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                          <MapPinned size={30} />
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-800">
                          Chưa có địa chỉ nhận hàng
                        </h3>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                          Thêm địa chỉ để thuận tiện hơn khi đặt mua sản phẩm.
                        </p>

                        <button
                          type="button"
                          onClick={startAddingAddress}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          <Plus size={17} />
                          Thêm địa chỉ đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ==========================================
          CUSTOMER INFORMATION MODAL
      ========================================== */}
      {editing && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditing();
          }}
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-customer-title"
            className="relative z-10 my-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20">
              <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-6 text-white sm:px-8">
                <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border-[24px] border-white/10" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                      <Pencil size={22} />
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-100">
                        Hồ sơ cá nhân
                      </p>

                      <h2
                        id="edit-customer-title"
                        className="text-xl font-bold sm:text-2xl"
                      >
                        Chỉnh sửa thông tin
                      </h2>

                      <p className="mt-1 text-sm text-teal-50">
                        Cập nhật hồ sơ khách hàng của bạn.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeEditing}
                    disabled={saving}
                    aria-label="Đóng cửa sổ"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Mã khách hàng
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {profile.customer_code}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="customer-full-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Họ và tên
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="customer-full-name"
                      autoFocus
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      maxLength={100}
                      disabled={saving}
                      placeholder="Nhập họ và tên"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-date-of-birth"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Ngày sinh
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="customer-date-of-birth"
                      type="date"
                      value={formDateOfBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(event) =>
                        setFormDateOfBirth(event.target.value)
                      }
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-gender"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Giới tính
                  </label>

                  <div className="relative">
                    <VenusAndMars
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      id="customer-gender"
                      value={formGender}
                      onChange={(event) => setFormGender(event.target.value)}
                      disabled={saving}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                    >
                      <option value="">Chưa cập nhật</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {editError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="whitespace-pre-line">{editError}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditing}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X size={17} />
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    onClick={() => void saveCustomerProfile()}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT ADDRESS MODAL
      ========================================== */}
      {editingAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAddressEditing();
          }}
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-address-title"
            className="relative z-10 my-auto w-full max-w-lg"
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
              <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-6 text-white sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                      <MapPin size={22} />
                    </div>

                    <div>
                      <h2
                        id="edit-address-title"
                        className="text-xl font-bold"
                      >
                        Chỉnh sửa địa chỉ
                      </h2>
                      <p className="mt-1 text-sm text-teal-50">
                        Cập nhật địa chỉ nhận hàng của bạn.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeAddressEditing}
                    disabled={savingAddress}
                    aria-label="Đóng cửa sổ"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <AddressFields
                  line={formAddressLine}
                  setLine={setFormAddressLine}
                  ward={formAddressWard}
                  setWard={setFormAddressWard}
                  province={formAddressProvince}
                  setProvince={setFormAddressProvince}
                  isDefault={formAddressDefault}
                  setIsDefault={setFormAddressDefault}
                  disabled={savingAddress}
                  idPrefix="edit-address"
                />

                {addressEditError && (
                  <ErrorMessage message={addressEditError} />
                )}

                <ModalActions
                  onCancel={closeAddressEditing}
                  onSave={() => void saveAddress()}
                  saving={savingAddress}
                  saveLabel="Lưu thay đổi"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD ADDRESS MODAL
      ========================================== */}
      {addingAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAddingAddress();
          }}
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-address-title"
            className="relative z-10 my-auto w-full max-w-lg"
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
              <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-6 text-white sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                      <Plus size={22} />
                    </div>

                    <div>
                      <h2 id="add-address-title" className="text-xl font-bold">
                        Thêm địa chỉ nhận hàng
                      </h2>
                      <p className="mt-1 text-sm text-teal-50">
                        Nhập thông tin địa chỉ mới.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeAddingAddress}
                    disabled={savingNewAddress}
                    aria-label="Đóng cửa sổ"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <AddressFields
                  line={newAddressLine}
                  setLine={setNewAddressLine}
                  ward={newAddressWard}
                  setWard={setNewAddressWard}
                  province={newAddressProvince}
                  setProvince={setNewAddressProvince}
                  isDefault={newAddressDefault}
                  setIsDefault={setNewAddressDefault}
                  disabled={savingNewAddress}
                  idPrefix="new-address"
                />

                {addAddressError && (
                  <ErrorMessage message={addAddressError} />
                )}

                <ModalActions
                  onCancel={closeAddingAddress}
                  onSave={() => void saveNewAddress()}
                  saving={savingNewAddress}
                  saveLabel="Thêm địa chỉ"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ==========================================
// Reusable address form
// ==========================================
function AddressFields({
  line,
  setLine,
  ward,
  setWard,
  province,
  setProvince,
  isDefault,
  setIsDefault,
  disabled,
  idPrefix,
}: {
  line: string;
  setLine: (value: string) => void;
  ward: string;
  setWard: (value: string) => void;
  province: string;
  setProvince: (value: string) => void;
  isDefault: boolean;
  setIsDefault: (value: boolean) => void;
  disabled: boolean;
  idPrefix: string;
}) {
  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60";

  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-line`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Địa chỉ <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id={`${idPrefix}-line`}
            value={line}
            onChange={(event) => setLine(event.target.value)}
            maxLength={255}
            disabled={disabled}
            placeholder="Số nhà, tên đường..."
            className={`${inputClass} pl-11`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-ward`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Phường / Xã
        </label>

        <input
          id={`${idPrefix}-ward`}
          value={ward}
          onChange={(event) => setWard(event.target.value)}
          maxLength={100}
          disabled={disabled}
          placeholder="Nhập phường / xã"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-province`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Tỉnh / Thành phố
        </label>

        <input
          id={`${idPrefix}-province`}
          value={province}
          onChange={(event) => setProvince(event.target.value)}
          maxLength={100}
          disabled={disabled}
          placeholder="Nhập tỉnh / thành phố"
          className={inputClass}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/50">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(event) => setIsDefault(event.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 accent-teal-600"
        />

        <span className="flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Star size={15} className="text-teal-600" />
            Đặt làm địa chỉ mặc định
          </span>

          <span className="mt-1 block text-xs leading-5 text-slate-500">
            Địa chỉ này sẽ được ưu tiên khi chọn nơi nhận hàng.
          </span>
        </span>
      </label>
    </>
  );
}

// ==========================================
// Reusable error message
// ==========================================
function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p className="whitespace-pre-line">{message}</p>
    </div>
  );
}

// ==========================================
// Reusable modal actions
// ==========================================
function ModalActions({
  onCancel,
  onSave,
  saving,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X size={17} />
        Hủy bỏ
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <Check size={17} />
            {saveLabel}
          </>
        )}
      </button>
    </div>
  );
}