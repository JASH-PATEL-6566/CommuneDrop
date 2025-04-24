export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        })
    } catch (e) {
        return dateString
    }
}

export const getRelativeTime = (dateString: string): string => {
    try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffSecs = Math.floor(diffMs / 1000)
        const diffMins = Math.floor(diffSecs / 60)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)
        if (diffDays > 30) {
        return formatDate(dateString)
        } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
        } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
        } else if (diffMins > 0) {
        return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
        } else {
        return "Just now"
        }
    } catch (e) {
        return dateString
    }
}

